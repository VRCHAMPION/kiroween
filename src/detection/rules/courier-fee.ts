import { findPhrases, type PhrasePattern } from '../patterns';
import type { Rule } from '../types';

const PATTERNS: readonly PhrasePattern[] = [
  {
    re: /\b(?:customs|clearance|redelivery|re-delivery|address update|delivery|shipping)\s+(?:duty|fees?|charges?|payment)\b/i,
    severity: 'high',
    reason: 'Courier companies do not ask for small fees through links in messages.',
  },
  {
    re: /\b(?:parcel|package|shipment|couriers?|consignment)\b[^.\n]{0,60}\b(?:held|on hold|stuck|seized|customs|undeliver\w*|could not be delivered|returned)\b/i,
    severity: 'medium',
    reason: 'A "parcel on hold" message is a common trick to collect a fake fee.',
  },
];

export const courierFee: Rule = {
  id: 'courier-fee',
  check(input) {
    return findPhrases(input.text, PATTERNS, { type: 'courier-fee', label: 'Parcel fee trick', skip: input.links });
  },
};