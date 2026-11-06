import { prepare } from './prepare';
import { RULES } from './registry';
import { scoreFlags, verdictFor } from './score';
import type { AnalysisInput, AnalysisResult, FlagSource, RedFlag } from './types';

const SOURCE_ORDER: Readonly<Record<FlagSource, number>> = { body: 0, header: 1, attachment: 2 };

function compareFlags(a: RedFlag, b: RedFlag): number {
  return (
    SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source] ||
    (a.attachmentIndex ?? -1) - (b.attachmentIndex ?? -1) ||
    a.start - b.start ||
    a.end - b.end ||
    a.type.localeCompare(b.type)
  );
}

/**
 * Analyses one message. Pure and synchronous: no clock, no randomness,
 * no storage and no network. The same input always gives the same result.
 */
export function analyse(input: AnalysisInput): AnalysisResult {
  const prepared = prepare(input);
  const seen = new Set<string>();
  const flags: RedFlag[] = [];
  for (const rule of RULES) {
    for (const flag of rule.check(prepared)) {
      if (flag.end > flag.start && !seen.has(flag.id)) {
        seen.add(flag.id);
        flags.push(flag);
      }
    }
  }
  flags.sort(compareFlags);
  const score = scoreFlags(flags);
  return { score, verdict: verdictFor(score), flags, headerText: prepared.headerText };
}