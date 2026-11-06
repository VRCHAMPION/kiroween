import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { lookalikeDomain } from './lookalike-domain';

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