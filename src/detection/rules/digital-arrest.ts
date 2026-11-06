import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\bdigital(?:ly)? arrest\w*\b/i,
    severity: 'high',
    reason: 'There is no such thing as a "digital arrest"; police never arrest anyone over a call.',
  },
  {
    re: /\b(?:stay on|do not (?:disconnect|leave|cut)) (?:the |this )?(?:video )?call\b/i,
    severity: 'high',
    reason: 'Being told to stay on a video call is how fake officers keep you isolated and scared.',
  },
  {
    re: /\b(?:drugs|narcotics)\b[^.\n]{0,40}\b(?:parcel|package)\b|\b(?:parcel|package)\b[^.\n]{0,40}\b(?:drugs|narcotics)\b/i,
    severity: 'high',
    reason: 'A "parcel with drugs in your name" story is the usual start of a fake arrest scam.',
  },
  {
    re: /\b(?:cbi|ncb|enforcement directorate|narcotics bureau|cyber (?:crime|cell) (?:officer|department|police)|customs officer|trai officer)\b/i,
    severity: 'medium',
    reason: 'Scammers pretend to be from agencies like the CBI to frighten you.',
  },
  {
    re: /\bmoney laundering\b/i,
    severity: 'medium',
    reason: 'Accusing you of money laundering is a fear tactic used in fake arrest scams.',
  },
];

export const digitalArrest: Rule = {
  id: 'digital-arrest',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'digital-arrest', label: 'Fake "digital arrest"', skip: input.links });
  },
};