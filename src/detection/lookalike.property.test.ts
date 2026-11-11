import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyse } from './analyse';
import { BRANDS, findBrandLookalike } from './brands';
import { getData } from './data-loader';
import { CONFUSABLES } from './normalise';
import { parseDomain } from './domain';

const officialDomains = BRANDS.flatMap((b) => b.official);
const swappable = BRANDS.flatMap((b) => b.keys.map((key) => ({ key, official: b.official[0] }))).filter(({ key }) =>
  [...key].some((ch) => Object.values(CONFUSABLES).includes(ch)),
);
const swapOne = (key: string, pick: number, which: number): string => {
  const positions = [...key].map((ch, i) => [ch, i] as const).filter(([ch]) => Object.entries(CONFUSABLES).some(([, v]) => v === ch));
  const [ch, at] = positions[pick % positions.length];
  const sources = Object.entries(CONFUSABLES).filter(([, v]) => v === ch).map(([k]) => k);
  return key.slice(0, at) + sources[which % sources.length] + key.slice(at + 1);
};

describe('lookalike properties', () => {
  // For any curated brand name with one letter swapped for a look-alike character, the address is flagged.
  it('flags a brand name with one confusable swap', () => {
    fc.assert(
      fc.property(fc.constantFrom(...swappable), fc.nat(50), fc.nat(50), ({ key }, pick, which) => {
        const host = `${swapOne(key, pick, which)}.example`;
        expect(findBrandLookalike(host), host).toBeDefined();
      }),
      { numRuns: 200 },
    );
  });

  // For any famous generated brand of 6 or more letters, one look-alike swap in its name is flagged.
  it('flags a famous generated brand with one confusable swap', () => {
    const data = getData();
    const names = (data?.topBrands ?? [])
      .map((domain) => ({ domain, ...parseDomain(domain) }))
      .filter((d) => d.name.length >= 6 && /^[a-z]+$/.test(d.name) && !officialDomains.includes(d.domain) && /[oli]/.test(d.name));
    expect(names.length).toBeGreaterThan(50);
    fc.assert(
      fc.property(fc.constantFrom(...names), ({ name, suffix }) => {
        const at = name.search(/[oli]/);
        const swapped = ({ o: '0', l: '1', i: '\u0456' } as Record<string, string>)[name[at]];
        const host = `${name.slice(0, at)}${swapped}${name.slice(at + 1)}.${suffix}`;
        expect(findBrandLookalike(host), host).toBeDefined();
      }),
      { numRuns: 200 },
    );
  });

  // For any official brand domain, the domain, www. plus it, and a subdomain of it are never flagged as a lookalike.
  it('never flags an official domain as its own lookalike', () => {
    const data = getData();
    const famous = [...officialDomains, ...(data?.topBrands ?? [])];
    fc.assert(
      fc.property(fc.constantFrom(...famous), fc.constantFrom('', 'www.', 'login.'), (domain, prefix) => {
        expect(findBrandLookalike(`${prefix}${domain}`), `${prefix}${domain}`).toBeUndefined();
      }),
      { numRuns: 300 },
    );
  });

  // For any string, analyse never throws and gives the same answer twice.
  it('analyse never throws and is deterministic', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 200 }), (text) => {
        const first = analyse({ text });
        expect(analyse({ text })).toEqual(first);
      }),
      { numRuns: 200 },
    );
  });

  // For any string used as a host, the lookalike check never throws.
  it('findBrandLookalike never throws on any string', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (host) => {
        expect(() => findBrandLookalike(host)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });
});