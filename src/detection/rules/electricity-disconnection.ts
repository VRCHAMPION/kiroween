import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:electricity|power|light|bijli|eb)\b[^.\n]{0,60}\b(?:disconnect\w*|cut off|cut|suspend\w*)\b/i,
    severity: 'high',
    reason: 'Power companies send written notices; they do not threaten to cut power tonight by text.',
  },
  {
    re: /\b(?:bill|payment)\b[^.\n]{0,30}\bnot (?:been )?updated\b/i,
    severity: 'high',
    reason: '"Your bill was not updated" is a known electricity scam phrase.',
  },
];

export const electricityDisconnection: Rule = {
  id: 'electricity-disconnection',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'electricity-disconnection', label: 'Power cut threat' });
  },
};