import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\bearn\b[^.\n]{0,20}?(?:\u20b9|rs\.?|inr)\s?\d[\d,]*[^.\n]{0,15}?\b(?:daily|per day|a day|per hour|an hour|weekly)\b/i,
    severity: 'high',
    reason: 'Promises of big daily earnings for little work are a sign of a task scam.',
  },
  {
    re: /\b(?:work from home|part[- ]time (?:job|work)|online job)\b/i,
    severity: 'medium',
    reason: 'Unsolicited part-time job offers by message are often task scams.',
  },
  {
    re: /\b(?:(?:like|liking|subscribe to|subscribing to) (?:youtube )?videos?|rate (?:hotels|products|movies)|(?:simple|easy) tasks?|prepaid tasks?|task[- ]based|daily (?:payment|income|salary))\b/i,
    severity: 'medium',
    reason: 'Being paid to like videos or do small tasks is how task scams start before asking for money.',
  },
];

export const jobTaskScam: Rule = {
  id: 'job-task-scam',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'job-task-scam', label: 'Too-good job offer', skip: input.links });
  },
};