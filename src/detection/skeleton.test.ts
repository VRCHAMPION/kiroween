import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isMixedScript, scriptsOf, skeleton } from './skeleton';

describe('scriptsOf', () => {
  it('treats digits, hyphens and accents as part of one script', () => {
    expect([...scriptsOf('bank-1')]).toEqual(['Latin']);
    expect([...scriptsOf('caf\u00e9')]).toEqual(['Latin']);
    expect(isMixedScript('bank-1')).toBe(false);
    expect(isMixedScript('caf\u00e9')).toBe(false);
  });

  it('sees Latin mixed with Cyrillic or Greek', () => {
    expect(isMixedScript('p\u0430ypal')).toBe(true);
    expect(isMixedScript('g\u03bfogle')).toBe(true);
  });

  it('does not call a single non-Latin script mixed', () => {
    expect(isMixedScript('\u0928\u092e\u0938\u094d\u0924\u0947')).toBe(false);
    expect(isMixedScript('\u0434\u043e\u043c')).toBe(false);
  });
});

describe('skeleton', () => {
  it('folds look-alike letters and stand-in digits to Latin', () => {
    expect(skeleton('p\u0430ypal')).toBe('paypal');
    expect(skeleton('g00gle')).toBe('google');
    expect(skeleton('arnazon')).toBe('amazon');
  });

  // For any string, folding twice gives the same result as folding once.
  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(skeleton(skeleton(text))).toBe(skeleton(text));
      }),
      { numRuns: 300 },
    );
  });
});