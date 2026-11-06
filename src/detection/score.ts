import type { RedFlag, Severity, Verdict } from './types';

export const SEVERITY_WEIGHT: Readonly<Record<Severity, number>> = {
  low: 0.1,
  medium: 0.25,
  high: 0.5,
};

/** A score of 100 would read as certainty, which Phantom Inbox never claims. */
export const MAX_SCORE = 99;
export const LIKELY_SCAM_AT = 60;
export const SUSPICIOUS_AT = 25;

/**
 * 100 * (1 - product of (1 - w)) over flag types, where w is the strongest
 * weight seen for that type. Every factor is at most 1, so adding a flag can
 * only keep or raise the score.
 */
export function scoreFlags(flags: readonly Pick<RedFlag, 'type' | 'severity'>[]): number {
  const strongest = new Map<string, number>();
  for (const flag of flags) {
    const weight = SEVERITY_WEIGHT[flag.severity];
    strongest.set(flag.type, Math.max(strongest.get(flag.type) ?? 0, weight));
  }
  let safe = 1;
  for (const weight of strongest.values()) {
    safe *= 1 - weight;
  }
  return Math.min(MAX_SCORE, Math.max(0, Math.round(100 * (1 - safe))));
}

export function verdictFor(score: number): Verdict {
  if (score >= LIKELY_SCAM_AT) {
    return 'likely scam';
  }
  if (score >= SUSPICIOUS_AT) {
    return 'suspicious';
  }
  return 'looks safe';
}