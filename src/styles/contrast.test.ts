import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from './contrast';

const hexColour = fc
  .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
  .map(([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));

describe('contrastRatio examples', () => {
  it('gives 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 9);
  });

  it('gives 1 for identical colours', () => {
    expect(contrastRatio('#336699', '#336699')).toBe(1);
  });

  it('gives about 4.48 for #777777 on white (a known near-miss of AA)', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('throws on invalid hex', () => {
    expect(() => parseHex('red')).toThrow();
  });
});

describe('contrastRatio properties', () => {
  // Feature: phantom-inbox-foundation, Property 1: Contrast ratio is symmetric and bounded
  // The contrast ratio is symmetric in its arguments and always lies between 1 and 21.
  it('is symmetric and between 1 and 21', () => {
    fc.assert(
      fc.property(hexColour, hexColour, (a, b) => {
        const ab = contrastRatio(a, b);
        expect(ab).toBe(contrastRatio(b, a));
        expect(ab).toBeGreaterThanOrEqual(1);
        expect(ab).toBeLessThanOrEqual(21 + 1e-9);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: phantom-inbox-foundation, Property 2: Contrast of identical colours is 1
  // Any colour compared with itself has a contrast ratio of exactly 1.
  it('is 1 for identical colours', () => {
    fc.assert(
      fc.property(hexColour, (c) => {
        expect(contrastRatio(c, c)).toBe(1);
      }),
      { numRuns: 200 },
    );
  });
});