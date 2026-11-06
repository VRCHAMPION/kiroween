import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:any ?desk|team ?viewer|quick ?support|rust ?desk|ultra ?viewer|airdroid|ammyy)\b/i,
    severity: 'high',
    reason: 'Remote-access apps let a stranger control your phone and empty your bank account.',
  },
  {
    re: /\bscreen[- ]shar(?:e|ing)\b/i,
    severity: 'medium',
    reason: 'Sharing your screen can show a stranger your OTPs and banking details.',
  },
];

export const remoteAccessApp: Rule = {
  id: 'remote-access-app',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'remote-access-app', label: 'Asks to install remote access', negationGuard: true });
  },
};