import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { upiRefund } from './upi-refund';

describe('upi-refund rule', () => {
  it('flags refunds that need a UPI action', () => {
    expect(spans(run(upiRefund, 'To receive the refund, approve the request.'))).toEqual(['refund, approve']);
    expect(spans(run(upiRefund, 'Enter your PIN to receive the money.'))).toEqual(['Enter your PIN to receive']);
    expect(spans(run(upiRefund, 'Scan this QR code to receive Rs 500.'))).toEqual(['Scan this QR code to receive']);
  });

  it('does not flag a normal refund notice', () => {
    expect(run(upiRefund, 'Your refund of Rs 499 has been credited to your account.')).toEqual([]);
  });
});