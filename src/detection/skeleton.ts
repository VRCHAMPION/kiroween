import { normaliseConfusables } from './normalise';

/**
 * The "skeleton" of a name: look-alike characters folded to the Latin letters and digits they imitate
 * (Unicode confusables once loaded, plus hand-made stand-ins such as 0, 1, rn and vv).
 * Two names with the same skeleton look the same to a person.
 */
export const skeleton: (text: string) => string = normaliseConfusables;

/** Scripts we tell apart. Anything else is counted as its own "Other" script. */
const SCRIPTS = [
  'Latin', 'Cyrillic', 'Greek', 'Armenian', 'Hebrew', 'Arabic', 'Devanagari', 'Bengali', 'Gurmukhi', 'Gujarati',
  'Oriya', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Thai', 'Georgian', 'Ethiopic', 'Hangul', 'Cherokee',
] as const;
const SCRIPT_TESTS = SCRIPTS.map((name) => [name, new RegExp(`^\\p{Script=${name}}$`, 'u')] as const);
const NEUTRAL = /^[\p{Script=Common}\p{Script=Inherited}]$/u;
// Japanese and Chinese writing mix these on purpose, so they count as one script.
const CJK = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u;

/**
 * The scripts used by the letters of a label. Digits, hyphens, punctuation (Common) and combining marks
 * (Inherited) are ignored, and accented Latin letters count as Latin.
 */
export function scriptsOf(label: string): Set<string> {
  const found = new Set<string>();
  for (const ch of label) {
    if (NEUTRAL.test(ch)) continue;
    if (CJK.test(ch)) {
      found.add('CJK');
      continue;
    }
    found.add(SCRIPT_TESTS.find(([, test]) => test.test(ch))?.[0] ?? 'Other');
  }
  return found;
}

/** True when a label mixes two or more scripts, such as Latin with Cyrillic. */
export function isMixedScript(label: string): boolean {
  return scriptsOf(label).size >= 2;
}
