import { getData } from './data-loader';

/**
 * Look-alike characters folded to the Latin letter they imitate.
 * Keys are lower-case because the text is lower-cased first.
 */
export const CONFUSABLES: Readonly<Record<string, string>> = {
  // Cyrillic
  '\u0430': 'a',
  '\u0435': 'e',
  '\u0451': 'e',
  '\u043e': 'o',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0443': 'y',
  '\u0445': 'x',
  '\u0456': 'i',
  '\u0457': 'i',
  '\u0458': 'j',
  '\u0455': 's',
  '\u0501': 'd',
  '\u04bb': 'h',
  '\u04cf': 'l',
  '\u051b': 'q',
  '\u051d': 'w',
  '\u043a': 'k',
  '\u043c': 'm',
  '\u043f': 'n',
  '\u0433': 'r',
  '\u0432': 'b',
  '\u0442': 't',
  // Greek
  '\u03b1': 'a',
  '\u03b5': 'e',
  '\u03bf': 'o',
  '\u03c1': 'p',
  '\u03bd': 'v',
  '\u03b9': 'i',
  '\u03ba': 'k',
  '\u03c4': 't',
  '\u03c5': 'u',
  '\u03c7': 'x',
  // Latin look-alikes
  '\u0131': 'i',
  '\u0261': 'g',
  // Digits and symbols used in place of letters
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '5': 's',
  '|': 'l',
};

/** The Latin letter or digit a character imitates: the hand-made stand-ins first, then the Unicode confusables once loaded. */
export function confusableFor(ch: string): string | undefined {
  return CONFUSABLES[ch] ?? getData()?.confusables[ch];
}

function step(value: string): string {
  let out = '';
  for (const ch of value.normalize('NFKC').toLowerCase()) {
    out += confusableFor(ch) ?? ch;
  }
  // "rn" looks like "m" and "vv" looks like "w" in many fonts.
  while (out.includes('rn') || out.includes('vv')) {
    out = out.replace(/rn/g, 'm').replace(/vv/g, 'w');
  }
  return out;
}

/**
 * Folds look-alike characters to plain Latin letters for comparison only.
 * Repeats until nothing changes, so normalising twice gives the same result.
 */
export function normaliseConfusables(value: string): string {
  let current = value;
  for (let i = 0; i < 16; i += 1) {
    const next = step(current);
    if (next === current) {
      return current;
    }
    current = next;
  }
  return current;
}