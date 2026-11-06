import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const URGENCY: readonly PhrasePattern[] = [
  {
    re: /\bwithin\s+(?:\d+|one|two|three|twenty[- ]four)\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/i,
    severity: 'medium',
    reason: 'Scammers set short deadlines so you act before you have time to check.',
  },
  {
    re: /\b(?:immediately|urgently|urgent|right away|act now|asap)\b/i,
    severity: 'medium',
    reason: 'Pressure to act at once is a common way to stop you from thinking it through.',
  },
  {
    re: /\b(?:today|tonight) itself\b/i,
    severity: 'medium',
    reason: 'A same-day deadline is meant to rush you into acting without checking.',
  },
  {
    re: /\b(?:last (?:chance|warning|reminder)|final (?:notice|warning|reminder)|limited (?:time|seats|period|offer))\b/i,
    severity: 'medium',
    reason: '"Last chance" wording is meant to create panic or fear of missing out.',
  },
];

const THREAT: readonly PhrasePattern[] = [
  {
    re: /\b(?:account|card|sim|number|service|wallet|yono|connection|profile)\b[^.\n]{0,25}?\b(?:blocked|suspended|deactivated|frozen|closed|locked|disabled|terminated)\b/i,
    severity: 'medium',
    reason: 'Threatening to block your account is a scare tactic to make you obey quickly.',
  },
  {
    re: /\b(?:police (?:case|complaint)|arrest warrant|arrested|arrest|legal action|fir)\b/i,
    severity: 'high',
    reason: 'Police and arrest threats in a message are used to frighten you into paying.',
  },
];

export const urgencyThreats: Rule = {
  id: 'urgency-threats',
  check(input) {
    return [
      ...findPhrases(input.text, URGENCY, { type: 'urgency', label: 'Pressure to act fast', skip: input.links }),
      ...findPhrases(input.text, THREAT, { type: 'threat', label: 'Threat or scare tactic', skip: input.links }),
    ];
  },
};