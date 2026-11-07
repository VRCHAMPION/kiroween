import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyse, type RedFlag } from '../../../detection';
import { SAMPLES } from '../../../data/samples';
import {
  candleWaxHeight,
  deadlineOf,
  formatCountdown,
  ghostKind,
  isLinkFlag,
  MAX_COUNTDOWN_SECONDS,
  secondsUntilMidnight,
  trueNameFor,
  type TrueName,
} from './ghost-effects';

const flagsOf = (id: string) => {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) throw new Error(id);
  return analyse(sample).flags;
};
const find = (flags: RedFlag[], type: string) => {
  const flag = flags.find((f) => f.type === type);
  if (!flag) throw new Error(`no ${type}`);
  return flag;
};
const partsText = (t: TrueName) => t.parts.map((p) => t.address.slice(p.start, p.end));

describe('ghostKind', () => {
  it('gives each kind of trick its own effect', () => {
    expect(ghostKind({ type: 'lookalike-domain' })).toBe('lookalike');
    expect(ghostKind({ type: 'urgency' })).toBe('bleed');
    expect(ghostKind({ type: 'threat' })).toBe('bleed');
    expect(ghostKind({ type: 'url-shortener' })).toBe('link');
    expect(ghostKind({ type: 'ip-link' })).toBe('link');
    expect(ghostKind({ type: 'kyc-expiry' })).toBe('haunt');
  });

  it('treats only message links as link flags', () => {
    expect(isLinkFlag({ type: 'lookalike-domain', source: 'body', text: 'x.example' })).toBe(true);
    expect(isLinkFlag({ type: 'lookalike-domain', source: 'header', text: 'x.example' })).toBe(false);
    expect(isLinkFlag({ type: 'risky-tld', source: 'body', text: 'x.top' })).toBe(true);
    expect(isLinkFlag({ type: 'urgency', source: 'body', text: 'now' })).toBe(false);
  });
});

describe('deadlines', () => {
  it.each([
    ['within 24 hours', 86400],
    ['within twenty-four hours', 86400],
    ['within 12 hrs', 43200],
    ['within 30 minutes', 1800],
    ['within 2 days', 172800],
    ['within 9999 days', MAX_COUNTDOWN_SECONDS],
  ])('reads "%s" as %i seconds', (text, seconds) => {
    expect(deadlineOf(text)).toBe(seconds);
  });

  it('counts "today itself" and "tonight" down to midnight', () => {
    expect(deadlineOf('today itself')).toBe('midnight');
    expect(deadlineOf('tonight itself')).toBe('midnight');
    expect(secondsUntilMidnight(new Date(2026, 10, 7, 23, 59, 0))).toBe(60);
    expect(secondsUntilMidnight(new Date(2026, 10, 7, 0, 0, 0))).toBe(86400);
  });

  it('finds no deadline in plain pressure words', () => {
    expect(deadlineOf('immediately')).toBeUndefined();
    expect(deadlineOf('Final notice')).toBeUndefined();
  });

  it('formats countdowns with hours past 24', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(3661)).toBe('01:01:01');
    expect(formatCountdown(172800)).toBe('48:00:00');
  });
});

describe('True Names', () => {
  it('reveals the real site behind mismatched link text', () => {
    const t = trueNameFor(find(flagsOf('scam-bank-link-mismatch'), 'link-text-mismatch'));
    expect(t?.address).toBe('http://203.0.113.45/vb/login.php');
    expect(partsText(t as TrueName)).toEqual(['203.0.113.45']);
    expect(t?.note).toBe('The words show vandanabank.example, but the link really opens 203.0.113.45.');
  });

  it('marks the shortener and says the destination stays hidden', () => {
    const t = trueNameFor(find(flagsOf('scam-kyc-expiry'), 'url-shortener')) as TrueName;
    expect(partsText(t)).toEqual(['bit.ly']);
    expect(t.note).toContain('never opens links');
  });

  it('marks the look-alike letter in paypa1', () => {
    const body = flagsOf('scam-paypal-homoglyph').find((f) => f.type === 'lookalike-domain' && f.source === 'body') as RedFlag;
    const t = trueNameFor(body) as TrueName;
    expect(t.address).toBe('https://paypa1-secure.example/login');
    expect(partsText(t)).toEqual(['1']);
  });

  it('marks a risky ending and the Cyrillic letters', () => {
    expect(partsText(trueNameFor(find(flagsOf('scam-courier-customs'), 'risky-tld')) as TrueName)).toEqual(['.top']);
    const cyrillic = trueNameFor(find(flagsOf('scam-cyrillic-apk'), 'lookalike-domain')) as TrueName;
    expect(partsText(cyrillic)).toEqual(['\u0455', '\u0456']);
  });

  it('reveals a lookalike sender address', () => {
    const header = flagsOf('scam-amazon-rn').find((f) => f.type === 'lookalike-domain' && f.source === 'header') as RedFlag;
    const t = trueNameFor(header) as TrueName;
    expect(t.address).toBe('arnazon-support.example');
    expect(partsText(t)).toEqual(['rn']);
  });

  it('has no True Name for flags that are not about links or senders', () => {
    expect(trueNameFor(find(flagsOf('scam-kyc-expiry'), 'kyc-expiry'))).toBeUndefined();
  });
});

describe('ghost-effects properties', () => {
  // Feature: haunted-view, Property 3: The candle never grows as the score rises
  // A higher score never gives a taller candle, and every height stays between the stub and full.
  it('never grows the candle as the score rises', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (x, y) => {
        const [a, b] = x <= y ? [x, y] : [y, x];
        const ha = candleWaxHeight(a, 96, 8);
        const hb = candleWaxHeight(b, 96, 8);
        expect(hb).toBeLessThanOrEqual(ha);
        expect(hb).toBeGreaterThanOrEqual(8);
        expect(ha).toBeLessThanOrEqual(96);
      }),
      { numRuns: 300 },
    );
    expect(candleWaxHeight(0, 96, 8)).toBe(96);
    expect(candleWaxHeight(99, 96, 8)).toBe(8);
  });

  // Feature: haunted-view, Property 4: Countdown text round-trips
  // Formatted countdowns parse back to the same seconds, and "within n units" reads as n times the unit.
  it('round-trips countdown text and reads stated deadlines', () => {
    const parse = (text: string) => {
      const [h, m, s] = text.split(':').map(Number);
      return h * 3600 + m * 60 + s;
    };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAX_COUNTDOWN_SECONDS }), (seconds) => {
        const text = formatCountdown(seconds);
        expect(text).toMatch(/^\d{2,}:\d{2}:\d{2}$/);
        expect(parse(text)).toBe(seconds);
      }),
      { numRuns: 300 },
    );
    const units: [string, number][] = [
      ['hours', 3600],
      ['hour', 3600],
      ['hrs', 3600],
      ['minutes', 60],
      ['mins', 60],
      ['days', 86400],
    ];
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), fc.constantFrom(...units), (n, [unit, size]) => {
        expect(deadlineOf(`Pay within ${n} ${unit} or else`)).toBe(Math.min(MAX_COUNTDOWN_SECONDS, n * size));
      }),
      { numRuns: 200 },
    );
  });

  // Feature: haunted-view, Property 5: True Name parts point inside the address
  // Every link or sender flag the engine finds has a True Name whose marked parts lie inside its address.
  it('keeps True Name parts inside the address for engine flags', () => {
    const LINKS = [
      'https://bit.ly/x1',
      'cutt.ly/abc',
      'https://paypa1-secure.example/login',
      'http://203.0.113.9/a',
      'https://\u0455bi-yono.example/app',
      'https://indiapost-help.top/pay',
      'arnazon.example',
      '<a href="https://evil.example/x">www.vandanabank.example</a>',
      '[www.swiftkart.example](https://login-check.click/a)',
    ];
    const message = fc.array(fc.oneof(fc.constantFrom(...LINKS), fc.string({ maxLength: 12 })), { minLength: 1, maxLength: 6 }).map((p) => p.join(' '));
    const headers = fc.constantFrom(undefined, { From: 'Support <help@paypa1.example>' }, { From: 'A <a@\u0430mazon.example>' });
    fc.assert(
      fc.property(message, headers, (text, h) => {
        for (const flag of analyse({ text, headers: h }).flags) {
          const sender = flag.type === 'lookalike-domain' && flag.source === 'header';
          if (!isLinkFlag(flag) && !sender) continue;
          const t = trueNameFor(flag);
          expect(t, `${flag.type} on ${flag.text}`).toBeDefined();
          const tn = t as TrueName;
          expect(tn.address).toBe(sender ? flag.text : flag.destination);
          expect(tn.parts.length).toBeGreaterThan(0);
          for (const p of tn.parts) {
            expect(p.start).toBeGreaterThanOrEqual(0);
            expect(p.end).toBeGreaterThan(p.start);
            expect(p.end).toBeLessThanOrEqual(tn.address.length);
          }
        }
      }),
      { numRuns: 300 },
    );
  });
});