import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { kycExpiry } from './kyc-expiry';

describe('kyc-expiry rule', () => {
  it('flags expired or pending KYC', () => {
    expect(spans(run(kycExpiry, 'Your bank KYC has expired.'))).toEqual(['KYC has expired']);
    expect(spans(run(kycExpiry, 'KYC pending, account on hold.'))).toEqual(['KYC pending']);
  });

  it('flags requests to update KYC or PAN', () => {
    expect(spans(run(kycExpiry, 'Please update your PAN card today'))).toEqual(['update your PAN card']);
  });

  it('does not start a match inside a web address', () => {
    expect(spans(run(kycExpiry, 'Open https://bit.ly/kyc-99 or your account will be blocked.'))).toEqual([]);
  });

  it('does not flag unrelated text', () => {
    expect(run(kycExpiry, 'Your order has been shipped.')).toEqual([]);
  });
});