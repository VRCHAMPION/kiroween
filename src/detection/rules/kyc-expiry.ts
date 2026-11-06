import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:kyc|know your customer)\b[^.\n]{0,40}?\b(?:expir\w*|pending|suspend\w*|block\w*|incomplete|not updated|update\w*|verif\w*)\b/i,
    severity: 'high',
    reason: 'Banks do not make you update KYC through a link in a message.',
  },
  {
    re: /\b(?:update|complete|verify|renew)\b[^.\n]{0,20}?\b(?:kyc|pan card|pan)\b/i,
    severity: 'high',
    reason: 'A request to update KYC or PAN through a message is a common bank scam.',
  },
];

export const kycExpiry: Rule = {
  id: 'kyc-expiry',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'kyc-expiry', label: 'KYC expiry scare', skip: input.links });
  },
};