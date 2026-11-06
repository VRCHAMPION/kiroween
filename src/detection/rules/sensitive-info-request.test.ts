import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { sensitiveInfoRequest } from './sensitive-info-request';

describe('sensitive-info-request rule', () => {
  it('flags requests for OTP, PIN, password and card details', () => {
    expect(spans(run(sensitiveInfoRequest, 'Please share the OTP you received.'))).toEqual(['share the OTP']);
    expect(spans(run(sensitiveInfoRequest, 'Enter your UPI PIN to continue.'))).toEqual(['Enter your UPI PIN']);
    expect(spans(run(sensitiveInfoRequest, 'Confirm your password now.'))).toEqual(['Confirm your password']);
    expect(spans(run(sensitiveInfoRequest, 'Kindly provide your card details.'))).toEqual(['provide your card details']);
  });

  it('does not flag warnings that negate the request', () => {
    expect(run(sensitiveInfoRequest, 'Never share your OTP, PIN or password with anyone.')).toEqual([]);
    expect(run(sensitiveInfoRequest, 'Do not share this code with anyone.')).toEqual([]);
  });

  it('does not flag a code the user asked for', () => {
    expect(run(sensitiveInfoRequest, 'Your one-time password for logging in is 482913.')).toEqual([]);
  });
});