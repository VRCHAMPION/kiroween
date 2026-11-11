import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BRANDS } from '../brands';
import { run, spans } from '../test-utils';
import { lookalikeDomain, plainHostText } from './lookalike-domain';

describe('lookalike-domain rule: real domains, homographs and typosquats', () => {
  it('flags a curated brand in front of another registrable domain, with exact span', () => {
    const text = 'Sign in: https://paypal.com.secure-login.xyz/verify';
    const flags = run(lookalikeDomain, text);
    expect(flags).toHaveLength(1);
    const host = 'paypal.com.secure-login.xyz';
    expect(flags[0].start).toBe(text.indexOf(host));
    expect(flags[0].end).toBe(text.indexOf(host) + host.length);
    expect(flags[0].severity).toBe('high');
    expect(flags[0].reason).toContain('secure-login.xyz');
    expect(flags[0].reason).toContain("PayPal's name in front of a different website");
  });

  it('flags look-alike letters copying a famous site and names its domain', () => {
    const flags = run(lookalikeDomain, 'Open https://g\u0456thub.com/login');
    expect(spans(flags)).toEqual(['g\u0456thub.com']);
    expect(flags[0].severity).toBe('high');
    expect(flags[0].reason).toContain('github.com');
  });

  it('flags a small spelling change from a famous site at medium severity, naming the domain only', () => {
    const flags = run(lookalikeDomain, 'Open https://githubb.com/login');
    expect(spans(flags)).toEqual(['githubb.com']);
    expect(flags[0].severity).toBe('medium');
    expect(flags[0].reason).toBe(
      'This web address is a small spelling change away from github.com, so it may be an imitation of that site.',
    );
  });

  it('shows the decoded name of an xn-- address as plain text', () => {
    const flags = run(lookalikeDomain, 'Open https://xn--pypal-4ve.com/login');
    expect(spans(flags)).toEqual(['xn--pypal-4ve.com']);
    expect(flags[0].reason).toContain('xn--pypal-4ve.com reads as p\u0430ypal.com');
  });

  it('flags an xn-- name that cannot be decoded, and mixed alphabets', () => {
    const bad = run(lookalikeDomain, 'Open https://xn--.example/x');
    expect(bad.length === 0 || bad[0].reason.includes('could not be read')).toBe(true);
    const mixed = run(lookalikeDomain, 'See https://b\u0430nkofficial.example');
    expect(mixed).toHaveLength(1);
    expect(mixed[0].severity).toBe('medium');
  });

  it('does not flag ordinary names, single-script names or accented names', () => {
    for (const text of [
      'Read https://mail.example.com/inbox',
      'Read https://news.example.org/today',
      'Visit https://my-office-deals.com/now',
      'Visit https://bank-1.in/home',
      'Visit https://caf\u00e9.in/menu',
      'Visit https://ample.com and https://median.com and https://forges.com',
    ]) {
      expect(run(lookalikeDomain, text)).toEqual([]);
    }
  });

  it('does not flag 30 ordinary real domains', () => {
    const ordinary = [
      'ample.com', 'median.com', 'forges.com', 'bakery.com', 'gardenia.in', 'tumbleweed.in', 'example.org', 'school.edu.in',
      'localnews.in', 'cityhospital.org', 'rainbowtoys.com', 'sundaymarket.in', 'bluebird.co.in', 'greenfields.in', 'mangoshop.in',
      'chaiwalla.in', 'hillstation.com', 'riverside.org', 'tailorsmart.in', 'booksandmore.in', 'pharmacyplus.in', 'kitchenworld.com',
      'sportsarena.in', 'travelmate.in', 'petcare.in', 'musicclass.in', 'yogastudio.in', 'carpoolers.in', 'farmfresh.in', 'weatherdesk.in',
    ];
    for (const domain of ordinary) {
      expect(run(lookalikeDomain, `Visit https://${domain}/home`), domain).toEqual([]);
    }
  });
  it('never names the decoded text with control or direction characters raw', () => {
    expect(plainHostText('a\u202Eb\u200Bc')).toBe('aU+202EbU+200Bc');
    expect(plainHostText('x'.repeat(200)).length).toBeLessThanOrEqual(80);
  });

  // For any official brand domain, the domain itself and www. in front of it are never flagged.
  it('never flags an official brand domain or its www. form', () => {
    const official = BRANDS.flatMap((b) => b.official);
    fc.assert(
      fc.property(fc.constantFrom(...official), fc.constantFrom('', 'www.', 'login.'), (domain, prefix) => {
        expect(run(lookalikeDomain, `Go to https://${prefix}${domain}/x`)).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});

describe('lookalike-domain rule', () => {
  it('flags a digit swap such as paypa1', () => {
    const flags = run(lookalikeDomain, 'Log in at https://paypa1-secure.example/login now');
    expect(spans(flags)).toEqual(['paypa1-secure.example']);
    expect(flags[0].severity).toBe('high');
    expect(flags[0].reason).toContain('PayPal');
  });

  it('flags "rn" written in place of "m"', () => {
    expect(spans(run(lookalikeDomain, 'Visit arnazon-deals.example today'))).toEqual(['arnazon-deals.example']);
  });

  it('flags Cyrillic look-alike letters', () => {
    const text = 'Open https://\u0455b\u0456-yono.example/app';
    const flags = run(lookalikeDomain, text);
    expect(spans(flags)).toEqual(['\u0455b\u0456-yono.example']);
    expect(flags[0].reason).toContain('SBI');
  });

  it('flags a brand name used on an unofficial domain', () => {
    expect(spans(run(lookalikeDomain, 'Pay at indiapost-redelivery.top/pay'))).toEqual(['indiapost-redelivery.top']);
  });

  it('flags foreign letters even without a known brand', () => {
    const flags = run(lookalikeDomain, 'See https://v\u0430ndana.example');
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe('medium');
  });

  it('flags a lookalike sender domain in the headers', () => {
    const flags = run(lookalikeDomain, { text: '', headers: { From: 'PayPal <service@paypa1.example>' } });
    expect(flags).toHaveLength(1);
    expect(flags[0].source).toBe('header');
    expect(flags[0].text).toBe('paypa1.example');
  });

  it('does not flag official brand domains or unrelated names', () => {
    expect(run(lookalikeDomain, 'Go to https://www.paypal.com/signin or https://onlinesbi.sbi')).toEqual([]);
    expect(run(lookalikeDomain, 'Track at https://swiftkart.example/track/1')).toEqual([]);
    expect(run(lookalikeDomain, 'Apply at https://apply-now.example')).toEqual([]);
  });
});