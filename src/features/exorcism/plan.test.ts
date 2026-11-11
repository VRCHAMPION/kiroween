import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyse, FLAG_TYPES, type FlagType, type RedFlag, type Verdict } from '../../detection';
import { SAMPLES } from '../../data/samples';
import { BASE_STEP_IDS, exorcismPlan, STEP_TRIGGERS, type Plan } from './plan';

const flagOf = (type: FlagType): RedFlag => ({
  id: type,
  type,
  label: type,
  severity: 'high',
  reason: 'r',
  source: 'body',
  start: 0,
  end: 1,
  text: 'x',
});
const planFor = (verdict: Verdict, types: readonly FlagType[]) => exorcismPlan({ verdict, flags: types.map(flagOf) });
const ids = (plan: Plan | undefined) => plan?.steps.map((s) => s.id) ?? [];
const sample = (id: string) => {
  const s = SAMPLES.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return exorcismPlan(analyse(s)) as Plan;
};

const CERTAINTY = /100%|definitely|guarantee|certain/i;
const DEVANAGARI = /[\u0900-\u097F]/;

describe('exorcismPlan examples', () => {
  it('starts with uninstalling the screen-sharing app when one is mentioned', () => {
    const plan = sample('scam-electricity');
    expect(ids(plan)[0]).toBe('uninstall-remote-app');
    expect(plan.steps[0].detail).toContain('number printed on your card');
    expect(ids(plan)).toContain('electricity-official');
  });

  it('puts the "already shared or paid" step near the top for UPI refunds', () => {
    const plan = sample('scam-upi-refund');
    expect(ids(plan).slice(0, 1)).toEqual(['already-shared']);
    expect(plan.warning.en).toContain('refund');
    expect(plan.warning.hi).toContain('रिफ़ंड');
  });

  it('warns about digital arrest in both languages', () => {
    const plan = sample('scam-digital-arrest');
    expect(ids(plan)).toContain('police-never-video-arrest');
    expect(plan.warning.en).toContain('Police never arrest anyone on a video call.');
    expect(plan.warning.hi).toContain('पुलिस कभी वीडियो कॉल पर किसी को गिरफ़्तार नहीं करती।');
  });

  it('gives the report step our own fixed links', () => {
    const report = sample('scam-kyc-expiry').steps.find((s) => s.id === 'report');
    expect(report?.links).toEqual([
      { label: 'Report at cybercrime.gov.in', href: 'https://cybercrime.gov.in' },
      { label: 'Call 1930', href: 'tel:1930' },
    ]);
  });

  it('words the intro and warning by verdict', () => {
    const likely = planFor('likely scam', ['kyc-expiry']) as Plan;
    const suspicious = planFor('suspicious', ['kyc-expiry']) as Plan;
    expect(likely.intro).toBe('This message is likely a scam. Follow these steps to stay safe.');
    expect(suspicious.intro).toBe('This message might be a scam. Until you are sure, follow these steps.');
    expect(likely.warning.en.startsWith('Scam alert! I got a message that looks like a scam, saying my bank KYC had expired')).toBe(true);
    expect(suspicious.warning.en.startsWith('Please be careful! I got a message that might be a scam,')).toBe(true);
    expect(suspicious.warning.hi.startsWith('सावधान!')).toBe(true);
  });

  it('gives every scam sample a plan and every genuine sample none', () => {
    for (const s of SAMPLES) {
      const plan = exorcismPlan(analyse(s));
      if (s.expectedVerdict === 'looks safe') expect(plan, s.id).toBeUndefined();
      else expect(plan, s.id).toBeDefined();
    }
  });
});

const typeSet = fc.uniqueArray(fc.constantFrom<FlagType>(...FLAG_TYPES), { maxLength: FLAG_TYPES.length });
const riskyVerdict = fc.constantFrom<Verdict>('likely scam', 'suspicious');

describe('exorcismPlan properties', () => {
  // Feature: screenshot-and-exorcism, Property 1: Every scam or suspicious plan has the base steps, each once
  // Any scam or suspicious plan has all five base steps, no repeated step, and urgent steps first.
  it('always has the base steps once each, with urgent steps first', () => {
    fc.assert(
      fc.property(riskyVerdict, typeSet, (verdict, types) => {
        const plan = planFor(verdict, types) as Plan;
        const list = ids(plan);
        for (const base of BASE_STEP_IDS) expect(list).toContain(base);
        expect(new Set(list).size).toBe(list.length);
        const firstCalm = plan.steps.findIndex((s) => !s.urgent);
        expect(plan.steps.slice(firstCalm).some((s) => s.urgent)).toBe(false);
        for (const step of plan.steps) {
          expect(step.title.length).toBeGreaterThan(0);
          expect(step.detail).toMatch(/[.!?"]$/);
          expect(`${step.title} ${step.detail}`).not.toMatch(CERTAINTY);
        }
      }),
      { numRuns: 300 },
    );
  });

  // Feature: screenshot-and-exorcism, Property 2: Flag steps appear exactly when their flags do
  // Each extra step is present exactly when one of its trigger flags is, and remote access always comes first.
  it('includes each flag step exactly when its trigger is found', () => {
    fc.assert(
      fc.property(riskyVerdict, typeSet, (verdict, types) => {
        const list = ids(planFor(verdict, types));
        for (const [stepId, triggers] of Object.entries(STEP_TRIGGERS)) {
          expect(list.includes(stepId), stepId).toBe(triggers.some((t) => types.includes(t)));
        }
        if (types.includes('remote-access-app')) expect(list[0]).toBe('uninstall-remote-app');
      }),
      { numRuns: 300 },
    );
  });

  // Feature: screenshot-and-exorcism, Property 3: Safe results get no plan
  // A "looks safe" result never gets next steps, whatever flags it carries.
  it('gives no plan for looks safe', () => {
    fc.assert(
      fc.property(typeSet, (types) => {
        expect(planFor('looks safe', types)).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  // Feature: screenshot-and-exorcism, Property 4: Family warnings never carry message text and always say how to report
  // Warnings never contain words from the message, always name the portal and 1930, and never claim certainty.
  it('builds warnings only from fixed text', () => {
    const SCAM_BITS = [
      'Your KYC has expired',
      'install AnyDesk',
      'approve the collect request',
      'digital arrest',
      'parcel is held at customs',
      'electricity will be disconnected',
      'Earn \u20b95,000 daily',
      'share the OTP',
      'https://bit.ly/x1',
      'https://paypa1.example/a',
      'within 24 hours',
      'Download app.apk',
    ];
    const marker = fc.stringMatching(/^[A-Z][a-z]{3}[0-9]{4}Zq$/);
    fc.assert(
      fc.property(marker, fc.array(fc.constantFrom(...SCAM_BITS), { minLength: 1, maxLength: 6 }), (word, bits) => {
        const text = `${word} ${bits.join('. ')} ${word}@mail.example 98${word.length}76`;
        const plan = exorcismPlan(analyse({ text }));
        if (!plan) return;
        for (const warning of [plan.warning.en, plan.warning.hi]) {
          expect(warning).not.toContain(word);
          expect(warning).toContain('cybercrime.gov.in');
          expect(warning).toContain('1930');
          expect(warning).not.toMatch(CERTAINTY);
          expect(warning).not.toMatch(/https?:\/\//);
        }
        expect(plan.warning.hi).toMatch(DEVANAGARI);
      }),
      { numRuns: 300 },
    );
  });
});