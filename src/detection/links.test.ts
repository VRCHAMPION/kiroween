import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { findLinks, parseHost, registrableDomain } from './links';

describe('registrableDomain', () => {
  it('judges the registrable domain, not a brand written in front of it', () => {
    expect(registrableDomain('paypal.com.secure-login.xyz')).toBe('secure-login.xyz');
    expect(registrableDomain('login.examplebank.co.in')).toBe('examplebank.co.in');
    expect(registrableDomain('203.0.113.9')).toBe('203.0.113.9');
  });
});

describe('link parsing properties', () => {
  // For any string, finding links and splitting a host never throws.
  it('never throws on any string', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(() => findLinks(text)).not.toThrow();
        expect(() => parseHost(text)).not.toThrow();
        expect(() => registrableDomain(text)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });
});