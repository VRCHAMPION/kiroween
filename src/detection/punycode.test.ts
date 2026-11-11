import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodePunycodeLabel, isUndecodableLabel, toUnicodeHost } from './punycode';

// Sample strings from RFC 3492 section 7.1 (the part after "xn--").
const RFC_VECTORS: ReadonlyArray<[string, string]> = [
  ['egbpdaj6bu4bxfgehfvwxn', '\u0644\u064a\u0647\u0645\u0627\u0628\u062a\u0643\u0644\u0645\u0648\u0634\u0639\u0631\u0628\u064a\u061f'],
  ['ihqwcrb4cv8a8dqg056pqjye', '\u4ed6\u4eec\u4e3a\u4ec0\u4e48\u4e0d\u8bf4\u4e2d\u6587'],
  ['ihqwctvzc91f659drss3x8bo0yb', '\u4ed6\u5011\u7232\u4ec0\u9ebd\u4e0d\u8aaa\u4e2d\u6587'],
  ['Proprostnemluvesky-uyb24dma41a', 'Pro\u010dprost\u011bnemluv\u00ed\u010desky'],
  ['b1abfaaepdrnnbgefbadotcwatmq2g4l', '\u043f\u043e\u0447\u0435\u043c\u0443\u0436\u0435\u043e\u043d\u0438\u043d\u0435\u0433\u043e\u0432\u043e\u0440\u044f\u0442\u043f\u043e\u0440\u0443\u0441\u0441\u043a\u0438'],
  ['3B-ww4c5e180e575a65lsy2b', '3\u5e74B\u7d44\u91d1\u516b\u5148\u751f'],
];

describe('decodePunycodeLabel', () => {
  it.each(RFC_VECTORS)('decodes the RFC 3492 sample %s', (encoded, decoded) => {
    expect(decodePunycodeLabel(`xn--${encoded}`)).toBe(decoded);
  });

  it('decodes a look-alike brand name', () => {
    expect(decodePunycodeLabel('xn--pypal-4ve')).toBe('p\u0430ypal');
    expect(toUnicodeHost('xn--pypal-4ve.com')).toBe('p\u0430ypal.com');
  });

  it('leaves plain labels and bad labels unchanged', () => {
    expect(decodePunycodeLabel('paypal')).toBe('paypal');
    expect(decodePunycodeLabel('xn--')).toBe('xn--');
    expect(decodePunycodeLabel('xn--!!')).toBe('xn--!!');
    expect(isUndecodableLabel('xn--!!')).toBe(true);
    expect(isUndecodableLabel('xn--pypal-4ve')).toBe(false);
    expect(isUndecodableLabel('paypal')).toBe(false);
  });

  // For any string, decoding never throws.
  it('never throws on any string', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(() => decodePunycodeLabel(text)).not.toThrow();
        expect(() => toUnicodeHost(`xn--${text}.com`)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  // For any label that does not start with xn--, decoding returns it unchanged.
  it('leaves labels without xn-- unchanged', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }).filter((s) => !/^xn--/i.test(s)), (text) => {
        expect(decodePunycodeLabel(text)).toBe(text);
      }),
      { numRuns: 200 },
    );
  });
});
