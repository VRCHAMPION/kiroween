import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { levenshtein } from './edit-distance';
import { findTyposquat, squatDistance, type SquatTarget } from './typosquat';

const curated = (name: string): SquatTarget => ({ name, domain: `${name}.com`, brandName: name, curated: true });
const generated = (name: string): SquatTarget => ({ name, domain: `${name}.com`, curated: false });

describe('squatDistance', () => {
  it('flags an added or dropped letter in a long enough name', () => {
    expect(squatDistance('githubb', generated('github'))).toBe(1);
    expect(squatDistance('hdfcbnk', curated('hdfcbank'))).toBe(1);
  });

  it('flags two changes only when both names have 8 or more letters and share a first letter', () => {
    expect(squatDistance('micrasoftx', generated('microsoft'))).toBe(2);
    expect(squatDistance('xicrasoftx', generated('microsoft'))).toBeUndefined();
    expect(squatDistance('abcdefg', generated('abcdefxy'))).toBeUndefined();
  });

  it('never flags short names, same-length swaps of short words, or the exact name', () => {
    expect(squatDistance('ebat', generated('ebay'))).toBeUndefined();
    expect(squatDistance('ample', curated('apple'))).toBeUndefined();
    expect(squatDistance('forges', generated('forbes'))).toBeUndefined();
    expect(squatDistance('google', generated('google'))).toBeUndefined();
  });

  it('requires the same first letter for generated names', () => {
    expect(squatDistance('xoogle', generated('google'))).toBeUndefined();
  });

  it('skips pairs whose lengths differ by more than 2', () => {
    expect(squatDistance('github', generated('githubxyz'))).toBeUndefined();
  });
});

describe('findTyposquat', () => {
  it('prefers a curated brand over a generated one', () => {
    const hit = findTyposquat('hdfcbnk', [generated('hdfcbank'), curated('hdfcbank')]);
    expect(hit?.brandName).toBe('hdfcbank');
  });
  it('returns nothing when no target is close', () => {
    expect(findTyposquat('plainname', [curated('hdfcbank')])).toBeUndefined();
  });
});

describe('edit distance properties', () => {
  const word = fc.string({ maxLength: 12 });

  // For any two strings, the distance is symmetric and is zero only for equal strings.
  it('is symmetric and zero only for equal strings', () => {
    fc.assert(
      fc.property(word, word, (a, b) => {
        expect(levenshtein(a, b)).toBe(levenshtein(b, a));
        expect(levenshtein(a, b) === 0).toBe(a === b);
      }),
      { numRuns: 200 },
    );
  });

  // For any three strings, going through a middle string is never shorter than going direct.
  it('obeys the triangle inequality', () => {
    fc.assert(
      fc.property(word, word, word, (a, b, c) => {
        expect(levenshtein(a, c)).toBeLessThanOrEqual(levenshtein(a, b) + levenshtein(b, c));
      }),
      { numRuns: 200 },
    );
  });
});