import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { emailAuthFail } from './email-auth-fail';

describe('email-auth-fail rule', () => {
  it('flags each failing SPF, DKIM and DMARC result in the header text', () => {
    const headers = { 'Authentication-Results': 'mx.example; spf=fail smtp.mailfrom=x.example; dkim=fail; dmarc=fail' };
    const flags = run(emailAuthFail, { text: '', headers });
    expect(spans(flags)).toEqual(['spf=fail', 'dkim=fail', 'dmarc=fail']);
    expect(flags.every((f) => f.source === 'header')).toBe(true);
    expect(flags.find((f) => f.text === 'dmarc=fail')?.severity).toBe('high');
  });

  it('reads raw header text and Received-SPF lines', () => {
    const flags = run(emailAuthFail, { text: '', headers: 'From: a@b.example\nReceived-SPF: softfail (domain does not designate)' });
    expect(spans(flags)).toEqual(['Received-SPF: softfail']);
  });

  it('does not flag passing results', () => {
    expect(run(emailAuthFail, { text: '', headers: { 'Authentication-Results': 'spf=pass; dkim=pass; dmarc=pass' } })).toEqual([]);
  });
});