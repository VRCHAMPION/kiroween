import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BRANDS, lookalikeParts, type CharRange } from './brands';
import { CONFUSABLES } from './normalise';

const textOf = (host: string, ranges: readonly CharRange[]) => ranges.map((r) => host.slice(r.start, r.end));

describe('lookalikeParts examples', () => {
  it('finds the digit 1 standing in for l in paypa1', () => {
    expect(textOf('paypa1-secure.example', lookalikeParts('paypa1-secure.example'))).toEqual(['1']);
  });

  it('finds "rn" standing in for m', () => {
    expect(lookalikeParts('arnazon-support.example')).toEqual([{ start: 1, end: 3 }]);
  });

  it('finds Cyrillic letters', () => {
    const host = '\u0455b\u0456-yono.example';
    expect(textOf(host, lookalikeParts(host))).toEqual(['\u0455', '\u0456']);
  });

  it('finds each zero in g00gle separately', () => {
    expect(textOf('g00gle-login.example', lookalikeParts('g00gle-login.example'))).toEqual(['0', '0']);
  });

  it('finds foreign letters in an unknown name', () => {
    expect(lookalikeParts('v\u0430ndana.example')).toEqual([{ start: 1, end: 2 }]);
  });

  it('returns nothing for plain brand-name abuse, official sites and normal sites', () => {
    expect(lookalikeParts('indiapost-redelivery.top')).toEqual([]);
    expect(lookalikeParts('www.paypal.com')).toEqual([]);
    expect(lookalikeParts('swiftkart.example')).toEqual([]);
    expect(lookalikeParts('203.0.113.9')).toEqual([]);
    expect(lookalikeParts('')).toEqual([]);
  });
});

/** Every stand-in for a letter: digits, Cyrillic and Greek look-alikes, plus "rn" for m and "vv" for w. */
const STAND_INS: Readonly<Record<string, readonly string[]>> = (() => {
  const map: Record<string, string[]> = { m: ['rn'], w: ['vv'] };
  for (const [from, to] of Object.entries(CONFUSABLES)) {
    if (from === '|' || from === to) continue;
    (map[to] ??= []).push(from);
  }
  return map;
})();

const keys = [...new Set(BRANDS.flatMap((b) => b.keys))];

const disguisedHost = fc.constantFrom(...keys).chain((key) =>
  fc
    .array(fc.option(fc.nat(), { nil: undefined }), { minLength: key.length, maxLength: key.length })
    .map((choices) => {
      let raw = '';
      const expected: CharRange[] = [];
      [...key].forEach((ch, i) => {
        const options = STAND_INS[ch];
        const choice = choices[i];
        if (options && choice !== undefined) {
          const sub = options[choice % options.length];
          expected.push({ start: raw.length, end: raw.length + sub.length });
          raw += sub;
        } else {
          raw += ch;
        }
      });
      return { key, host: `${raw}-secure.example`, expected };
    }),
);

describe('lookalikeParts properties', () => {
  // Feature: haunted-view, Property 1: Lookalike parts are exactly the substituted letters
  // For any brand key with some letters swapped for look-alikes, exactly the swapped characters are returned.
  it('returns exactly the substituted characters', () => {
    fc.assert(
      fc.property(disguisedHost, ({ host, expected }) => {
        expect(lookalikeParts(host)).toEqual(expected);
      }),
      { numRuns: 500 },
    );
  });

  // Feature: haunted-view, Property 2: Lookalike parts stay inside the host
  // For any string, every returned range is non-empty, inside the string, sorted and non-overlapping.
  it('keeps every range inside the host, sorted and non-overlapping', () => {
    const anyHost = fc.oneof(
      fc.string({ unit: 'binary', maxLength: 40 }),
      fc.array(fc.oneof(fc.constantFrom(...keys), fc.string({ maxLength: 6 }), fc.constantFrom('.', '-', '1', '0', 'rn', '\u0430', '\u0455')), { maxLength: 8 }).map((p) => p.join('') + '.example'),
    );
    fc.assert(
      fc.property(anyHost, (host) => {
        let previousEnd = 0;
        for (const r of lookalikeParts(host)) {
          expect(r.start).toBeGreaterThanOrEqual(previousEnd);
          expect(r.end).toBeGreaterThan(r.start);
          expect(r.end).toBeLessThanOrEqual(host.length);
          previousEnd = r.end;
        }
      }),
      { numRuns: 500 },
    );
  });
});