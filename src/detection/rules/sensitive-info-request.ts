import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:share|send|tell|enter|provide|give|confirm|verify|update|type|reply with|forward|submit)\b[^.\n]{0,40}?\b(?:otp|one[- ]time password|upi pin|atm pin|m-?pin|pin|password|passcode|cvv|card (?:number|details)|(?:debit|credit) card (?:number|details)|expiry date|net ?banking (?:password|details|credentials)|net ?banking)\b/i,
    severity: 'high',
    reason: 'Banks and real companies never ask for your OTP, PIN, password or card details.',
  },
];

export const sensitiveInfoRequest: Rule = {
  id: 'sensitive-info-request',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'sensitive-info-request', label: 'Asks for secret codes', skip: input.links, negationGuard: true });
  },
};