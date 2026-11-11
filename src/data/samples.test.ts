import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyse, FLAG_TYPES } from '../detection';
import { SAMPLES, type GenuineTopic, type ScamTopic } from './samples';

const scams = SAMPLES.filter((s) => s.id.startsWith('scam-'));
const genuine = SAMPLES.filter((s) => s.id.startsWith('genuine-'));

describe('sample messages', () => {
  it('has at least 25 messages, enough of each kind for a Séance game, with unique ids', () => {
    expect(SAMPLES.length).toBeGreaterThanOrEqual(25);
    expect(scams.length).toBeGreaterThanOrEqual(10);
    expect(genuine.length).toBeGreaterThanOrEqual(5);
    expect(scams.length + genuine.length).toBe(SAMPLES.length);
    expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(SAMPLES.length);
  });

  it('labels scams and genuine messages consistently', () => {
    for (const s of scams) expect(s.expectedVerdict, s.id).not.toBe('looks safe');
    for (const s of genuine) expect(s.expectedVerdict, s.id).toBe('looks safe');
  });

  it('covers every scam and genuine topic', () => {
    const scamTopics: ScamTopic[] = ['KYC expiry', 'Courier fee', 'Electricity disconnection', 'UPI refund', 'Job task', 'Digital arrest', 'Lookalike link', 'Risky attachment'];
    const genuineTopics: GenuineTopic[] = ['Bank alert', 'Delivery update', 'One-time code', 'Family message', 'Bill or receipt'];
    expect(new Set(scams.map((s) => s.topic))).toEqual(new Set(scamTopics));
    expect(new Set(genuine.map((s) => s.topic))).toEqual(new Set(genuineTopics));
  });

  it('gives every genuine message plain reasons why it is safe, and no scam any', () => {
    for (const s of genuine) {
      expect(s.safeReasons?.length ?? 0, s.id).toBeGreaterThan(0);
      for (const reason of s.safeReasons ?? []) expect(reason, s.id).toMatch(/^[A-Z].*[.]$/);
    }
    for (const s of scams) expect(s.safeReasons, s.id).toBeUndefined();
  });

  it.each(SAMPLES.map((s) => [s.id, s] as const))('%s gets its expected verdict', (_id, sample) => {
    const result = analyse(sample);
    expect(result.verdict, `${sample.id} scored ${result.score}`).toBe(sample.expectedVerdict);
  });

  it.each(scams.map((s) => [s.id, s] as const))('%s triggers its expected flag types', (_id, sample) => {
    const found = new Set(analyse(sample).flags.map((f) => f.type));
    for (const type of sample.expectedFlags) {
      expect(found.has(type), `${sample.id} is missing ${type}`).toBe(true);
    }
  });

  it('the scams together cover every red flag type', () => {
    const covered = new Set(scams.flatMap((s) => s.expectedFlags));
    expect([...FLAG_TYPES].filter((t) => !covered.has(t))).toEqual([]);
  });

  it.each(genuine.map((s) => [s.id, s] as const))('%s has no medium or high flags', (_id, sample) => {
    const strong = analyse(sample).flags.filter((f) => f.severity !== 'low');
    expect(strong.map((f) => `${f.type}: ${f.text}`)).toEqual([]);
  });

  it('includes a genuine bank alert and a genuine delivery update', () => {
    expect(genuine.map((s) => s.id)).toEqual(expect.arrayContaining(['genuine-bank-alert', 'genuine-delivery-update']));
  });

  it('uses only made-up domains for every link and address', () => {
    const allText = SAMPLES.map((s) => [s.text, ...Object.values(s.headers ?? {})].join('\n')).join('\n');
    const hosts = [...allText.matchAll(/(?:https?:\/\/|@)([^\s/<>"]+)/g)].map((m) => m[1].replace(/[.,]$/, ''));
    const fictional = /\.(example|top)$|^(bit\.ly|cutt\.ly)$|^\d+\.\d+\.\d+\.\d+$/;
    expect(hosts.filter((h) => !fictional.test(h))).toEqual([]);
  });
});
describe('sample properties', () => {
  // Feature: seance, Property 3: Every scam sample is checked as suspicious or likely scam
  // Whichever scam sample a game picks, the real engine flags it as suspicious or likely scam.
  it('checks every scam sample as suspicious or likely scam', () => {
    fc.assert(
      fc.property(fc.constantFrom(...scams), (sample) => {
        expect(['suspicious', 'likely scam']).toContain(analyse(sample).verdict);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: seance, Property 4: No genuine sample gets a high-severity flag
  // Whichever genuine sample a game picks, the real engine finds no high-severity flag and says it looks safe.
  it('never gives a genuine sample a high-severity flag', () => {
    fc.assert(
      fc.property(fc.constantFrom(...genuine), (sample) => {
        const result = analyse(sample);
        expect(result.flags.filter((f) => f.severity === 'high')).toEqual([]);
        expect(result.verdict).toBe('looks safe');
      }),
      { numRuns: 100 },
    );
  });
});
