import { prepare } from './prepare';
import type { AnalysisInput, RedFlag, Rule } from './types';

/** Runs one rule on a message, the same way the engine does. */
export function run(rule: Rule, input: AnalysisInput | string): RedFlag[] {
  return rule.check(prepare(typeof input === 'string' ? { text: input } : input));
}

/** The exact flagged words of each flag. */
export function spans(flags: readonly RedFlag[]): string[] {
  return flags.map((f) => f.text);
}