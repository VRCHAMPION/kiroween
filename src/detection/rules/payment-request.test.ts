import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { paymentRequest } from './payment-request';

describe('payment-request rule', () => {
  it('flags UPI collect requests', () => {
    expect(spans(run(paymentRequest, 'Please approve the collect request on your UPI app.'))).toEqual(['approve the collect request']);
  });

  it('flags gift card payments', () => {
    expect(spans(run(paymentRequest, 'Buy 4 Google Play gift cards and send the codes.'))).toEqual(['Google Play gift cards']);
    expect(spans(run(paymentRequest, 'Pay with gift cards only.'))).toEqual(['gift cards']);
  });

  it('does not flag warnings about gift cards', () => {
    expect(run(paymentRequest, 'Officials will never ask for gift cards.')).toEqual([]);
  });
});