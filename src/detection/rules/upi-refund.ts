import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\brefund\b[^.\n]{0,60}?\b(?:upi|collect|approve|pin|qr|scan)\b/i,
    severity: 'high',
    reason: 'You never need to approve a request, scan a code or enter a PIN to receive a refund.',
  },
  {
    re: /\b(?:enter|type)\b[^.\n]{0,20}?\bpin\b[^.\n]{0,20}?\b(?:receive|get|credit)\b/i,
    severity: 'high',
    reason: 'Your UPI PIN is only for sending money, never for receiving it.',
  },
  {
    re: /\b(?:scan|approve)\b[^.\n]{0,30}?\bto (?:receive|get)\b/i,
    severity: 'high',
    reason: 'Scanning a code or approving a request sends money; it never brings money in.',
  },
];

export const upiRefund: Rule = {
  id: 'upi-refund',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'upi-refund', label: 'Fake refund trick', skip: input.links });
  },
};