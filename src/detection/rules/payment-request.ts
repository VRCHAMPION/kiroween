import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:collect request|(?:approve|accept) (?:the |this |a )?(?:collect |payment |upi )?request|payment request)\b/i,
    severity: 'high',
    reason: 'Approving a UPI collect request sends money out of your account; it never brings money in.',
  },
  {
    re: /\b(?:google play (?:gift )?(?:cards?|codes?|vouchers?|recharge)|amazon pay (?:gift )?(?:cards?|vouchers?)|apple gift cards?|itunes cards?|steam cards?|gift ?cards?)\b/i,
    severity: 'high',
    reason: 'Real officials and companies never ask to be paid in gift cards.',
  },
];

export const paymentRequest: Rule = {
  id: 'payment-request',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'payment-request', label: 'Unusual payment request', skip: input.links, negationGuard: true });
  },
};