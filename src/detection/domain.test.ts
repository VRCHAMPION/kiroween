import fc from 'fast-check';
import { afterAll, describe, expect, it } from 'vitest';
import { ensureDetectionData, resetDetectionDataForTests } from './data-loader';
import { parseDomain } from './domain';

const CASES: ReadonlyArray<[string, string]> = [
  ['paypal.com.secure-login.xyz', 'secure-login.xyz'],
  ['www.example.com', 'example.com'],
  ['EXAMPLE.COM.', 'example.com'],
  ['bank.co.in', 'bank.co.in'],
  ['mail.bank.co.in', 'bank.co.in'],
  ['portal.x.gov.in', 'x.gov.in'],
  ['p\u0430ypal.com', 'p\u0430ypal.com'],
  ['xn--pypal-4ve.com', 'xn--pypal-4ve.com'],
  ['\u0434\u043e\u043c.\u0440\u0444', '\u0434\u043e\u043c.\u0440\u0444'],
  ['localhost', 'localhost'],
  ['127.0.0.1', '127.0.0.1'],
  ['[::1]', '[::1]'],
  ['foo.blogspot.com', 'blogspot.com'],
];

describe('parseDomain with the Public Suffix List', () => {
  it.each(CASES)('%s has registrable domain %s', (host, registrable) => {
    expect(parseDomain(host).registrable).toBe(registrable);
  });

  it('splits subdomain, name and suffix', () => {
    expect(parseDomain('paypal.com.secure-login.xyz')).toMatchObject({
      name: 'secure-login',
      suffix: 'xyz',
      subdomain: 'paypal.com',
      isIp: false,
    });
  });

  it('marks IP addresses', () => {
    expect(parseDomain('203.0.113.9').isIp).toBe(true);
    expect(parseDomain('example.com').isIp).toBe(false);
  });

  it('handles an empty host', () => {
    expect(parseDomain('').registrable).toBe('');
  });
});

describe('parseDomain before the data loads (pre-load mode)', () => {
  afterAll(async () => {
    await ensureDetectionData();
  });

  it('uses the small built-in table for the common cases', () => {
    resetDetectionDataForTests();
    expect(parseDomain('paypal.com.secure-login.xyz').registrable).toBe('secure-login.xyz');
    expect(parseDomain('mail.bank.co.in').registrable).toBe('bank.co.in');
    expect(parseDomain('localhost').registrable).toBe('localhost');
    expect(parseDomain('127.0.0.1').isIp).toBe(true);
  });
});

describe('parseDomain properties', () => {
  // For any string, parseDomain never throws.
  it('never throws on any string', async () => {
    await ensureDetectionData();
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(() => parseDomain(text)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  // For any string, the registrable domain of the registrable domain is itself.
  it('has an idempotent registrable domain', async () => {
    await ensureDetectionData();
    fc.assert(
      fc.property(fc.domain(), (host) => {
        const once = parseDomain(host).registrable;
        expect(parseDomain(once).registrable).toBe(once);
      }),
      { numRuns: 200 },
    );
  });
});
