import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { normaliseConfusables } from './normalise';

describe('normaliseConfusables examples', () => {
  it.each([
    ['paypa1', 'paypal'],
    ['arnazon', 'amazon'],
    ['\u0455b\u0456', 'sbi'],
    ['PAYPAL', 'paypal'],
    ['vvhatsapp', 'whatsapp'],
    ['g00gle', 'google'],
    ['\uff50\uff41\uff59\uff50\uff41\uff4c', 'paypal'],
  ])('folds %s to %s', (input, expected) => {
    expect(normaliseConfusables(input)).toBe(expected);
  });
});

const confusable = fc.constantFrom(
  'r', 'n', 'v', 'w', 'm', '0', '1', '3', '5', '|', 'a', 'I', 'R', 'N', 'V',
  '\u0430', '\u0435', '\u043e', '\u0440', '\u0441', '\u0455', '\u0456', '\u043f', '\u0433', '\u03bd', '\u03bf',
  '\u0410', '\u0405', '\u0131', '\u0130', '\ufb01', '\u212a', '\u00c5', '\u1e9e', '\u0345',
);

describe('normaliseConfusables properties', () => {
  // Feature: detection-engine, Property 3: Homoglyph normalisation is idempotent
  // Normalising an already normalised string returns the same string.
  it('is idempotent for arbitrary text', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 40 }), (s) => {
        const once = normaliseConfusables(s);
        expect(normaliseConfusables(once)).toBe(once);
      }),
      { numRuns: 500 },
    );
  });

  // Feature: detection-engine, Property 3: Homoglyph normalisation is idempotent
  // Strings packed with look-alike characters still settle after one normalisation.
  it('is idempotent for strings made of look-alike characters', () => {
    fc.assert(
      fc.property(fc.array(confusable, { maxLength: 30 }), (chars) => {
        const once = normaliseConfusables(chars.join(''));
        expect(normaliseConfusables(once)).toBe(once);
      }),
      { numRuns: 500 },
    );
  });
});