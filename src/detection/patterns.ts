import { makeFlag } from './flag';
import type { FlagType, RedFlag, Severity } from './types';

export interface PhrasePattern {
  re: RegExp;
  severity: Severity;
  reason: string;
}

export interface PhraseOptions {
  type: FlagType;
  label: string;
  /** Skip matches that the same sentence negates, as in "Never share your OTP". */
  negationGuard?: boolean;
  /** Ranges such as links; a match that starts inside one is skipped. */
  skip?: readonly { start: number; end: number }[];
}

const NEGATION = /\b(never|not|don't|dont|do not|no one|nobody|won't|will not)\b/i;
const RANK: Readonly<Record<Severity, number>> = { high: 3, medium: 2, low: 1 };

/** True when the sentence before `start` contains a negation word. */
export function isNegated(text: string, start: number): boolean {
  const before = text.slice(0, start);
  const cut = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?'), before.lastIndexOf('\n'));
  return NEGATION.test(before.slice(cut + 1));
}

interface Hit {
  start: number;
  end: number;
  pattern: PhrasePattern;
}

/** Keeps the strongest, earliest, longest match where matches overlap. */
function resolveOverlaps(hits: Hit[]): Hit[] {
  const ordered = [...hits].sort(
    (a, b) =>
      RANK[b.pattern.severity] - RANK[a.pattern.severity] || a.start - b.start || b.end - b.start - (a.end - a.start),
  );
  const kept: Hit[] = [];
  for (const hit of ordered) {
    if (!kept.some((k) => hit.start < k.end && k.start < hit.end)) {
      kept.push(hit);
    }
  }
  return kept.sort((a, b) => a.start - b.start);
}

/** Runs phrase patterns over the message body and returns one flag per kept match. */
export function findPhrases(text: string, patterns: readonly PhrasePattern[], options: PhraseOptions): RedFlag[] {
  const hits: Hit[] = [];
  for (const pattern of patterns) {
    const flags = pattern.re.flags.includes('g') ? pattern.re.flags : `${pattern.re.flags}g`;
    for (const m of text.matchAll(new RegExp(pattern.re.source, flags))) {
      if (m[0].length === 0) continue;
      if (options.negationGuard && isNegated(text, m.index)) continue;
      if (options.skip?.some((r) => m.index >= r.start && m.index < r.end)) continue;
      hits.push({ start: m.index, end: m.index + m[0].length, pattern });
    }
  }
  return resolveOverlaps(hits).map((hit) =>
    makeFlag(
      {
        type: options.type,
        label: options.label,
        severity: hit.pattern.severity,
        reason: hit.pattern.reason,
        source: 'body',
        start: hit.start,
        end: hit.end,
      },
      text,
    ),
  );
}