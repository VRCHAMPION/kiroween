import { CONFUSABLES, normaliseConfusables } from './normalise';
import { isIpHost, registrableDomain, suffixLabelCount } from './links';

export interface Brand {
  name: string;
  /** Normalised names that identify the brand inside a domain label. */
  keys: readonly string[];
  /** Registrable domains the brand really uses. */
  official: readonly string[];
}

/** Brands often imitated in India. Real names are needed for detection; no lookups are made. */
export const BRANDS: readonly Brand[] = [
  { name: 'PayPal', keys: ['paypal'], official: ['paypal.com', 'paypal.me'] },
  { name: 'SBI', keys: ['sbi', 'onlinesbi', 'statebank'], official: ['sbi.co.in', 'onlinesbi.sbi', 'sbi.bank.in', 'onlinesbi.com'] },
  { name: 'HDFC Bank', keys: ['hdfc', 'hdfcbank'], official: ['hdfcbank.com', 'hdfc.bank.in'] },
  { name: 'ICICI Bank', keys: ['icici', 'icicibank'], official: ['icicibank.com', 'icici.bank.in'] },
  { name: 'Axis Bank', keys: ['axisbank'], official: ['axisbank.com', 'axis.bank.in'] },
  { name: 'Paytm', keys: ['paytm'], official: ['paytm.com', 'paytm.in'] },
  { name: 'PhonePe', keys: ['phonepe'], official: ['phonepe.com'] },
  { name: 'Amazon', keys: ['amazon'], official: ['amazon.in', 'amazon.com'] },
  { name: 'Flipkart', keys: ['flipkart'], official: ['flipkart.com'] },
  { name: 'India Post', keys: ['indiapost'], official: ['indiapost.gov.in'] },
  { name: 'Blue Dart', keys: ['bluedart'], official: ['bluedart.com'] },
  { name: 'Delhivery', keys: ['delhivery'], official: ['delhivery.com'] },
  { name: 'Google', keys: ['google'], official: ['google.com', 'google.co.in'] },
  { name: 'Microsoft', keys: ['microsoft'], official: ['microsoft.com'] },
  { name: 'Apple', keys: ['apple', 'icloud'], official: ['apple.com', 'icloud.com'] },
  { name: 'Netflix', keys: ['netflix'], official: ['netflix.com'] },
  { name: 'WhatsApp', keys: ['whatsapp'], official: ['whatsapp.com'] },
  { name: 'NPCI', keys: ['npci', 'bhim'], official: ['npci.org.in', 'bhimupi.org.in'] },
  { name: 'Income Tax Department', keys: ['incometax'], official: ['incometax.gov.in'] },
  { name: 'UIDAI', keys: ['uidai', 'aadhaar', 'aadhar'], official: ['uidai.gov.in'] },
  { name: 'IRCTC', keys: ['irctc'], official: ['irctc.co.in'] },
];

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length];
}

export type LookalikeMatch =
  | { kind: 'brand'; brand: Brand; imitation: boolean }
  | { kind: 'foreign-script' };

/** Checks whether a host imitates a known brand or hides foreign look-alike letters. */
export function findBrandLookalike(host: string): LookalikeMatch | undefined {
  const lower = host.toLowerCase();
  if (lower === '' || isIpHost(lower)) {
    return undefined;
  }
  const registrable = registrableDomain(lower);
  if (BRANDS.some((b) => b.official.includes(registrable))) {
    return undefined;
  }
  const labels = lower.split('.');
  const names = labels.slice(0, Math.max(0, labels.length - suffixLabelCount(labels)));
  for (const label of names) {
    const candidates = new Set([label, label.replace(/-/g, ''), ...label.split('-')].filter((c) => c.length > 0));
    for (const raw of candidates) {
      const folded = normaliseConfusables(raw);
      for (const brand of BRANDS) {
        for (const key of brand.keys) {
          const hit =
            folded === key ||
            (key.length >= 6 && levenshtein(folded, key) <= 1) ||
            (key.length >= 6 && folded.includes(key));
          if (hit) {
            return { kind: 'brand', brand, imitation: raw !== key && !raw.includes(key) };
          }
        }
      }
    }
  }
  if ([...lower].some((ch) => ch.charCodeAt(0) > 0x7f) || /(^|\.)xn--/.test(lower)) {
    return { kind: 'foreign-script' };
  }
  return undefined;
}
export interface CharRange {
  start: number;
  end: number;
}

interface FoldedChar {
  c: string;
  start: number;
  end: number;
  /** True when the source character is a stand-in for a different letter. */
  changed: boolean;
}

/** Folds text like normaliseConfusables, but remembers which source characters each folded letter came from. */
function foldWithMap(raw: string): FoldedChar[] {
  const out: FoldedChar[] = [];
  let index = 0;
  for (const cp of raw) {
    const lowered = cp.toLowerCase();
    for (const ch of cp.normalize('NFKC').toLowerCase()) {
      const mapped = CONFUSABLES[ch] ?? ch;
      out.push({ c: mapped, start: index, end: index + cp.length, changed: mapped !== lowered });
    }
    index += cp.length;
  }
  const merged: FoldedChar[] = [];
  for (let i = 0; i < out.length; i += 1) {
    const a = out[i];
    const b = out[i + 1];
    if (b && ((a.c === 'r' && b.c === 'n') || (a.c === 'v' && b.c === 'v'))) {
      merged.push({ c: a.c === 'r' ? 'm' : 'w', start: a.start, end: b.end, changed: true });
      i += 1;
    } else {
      merged.push(a);
    }
  }
  return merged;
}

/** Marks the stand-in characters of one brand-key match inside a folded piece. */
function partsInPiece(piece: string, offset: number): CharRange[] {
  const folded = foldWithMap(piece);
  const text = folded.map((f) => f.c).join('');
  const out: CharRange[] = [];
  const mark = (from: number, to: number, differs: (j: number) => boolean) => {
    for (let j = from; j < to; j += 1) {
      if (folded[j].changed || differs(j)) {
        out.push({ start: offset + folded[j].start, end: offset + folded[j].end });
      }
    }
  };
  for (const brand of BRANDS) {
    for (const key of brand.keys) {
      let at = text.indexOf(key);
      while (at >= 0) {
        mark(at, at + key.length, () => false);
        at = text.indexOf(key, at + 1);
      }
      if (key.length >= 6 && text.length === key.length && levenshtein(text, key) === 1) {
        mark(0, text.length, (j) => text[j] !== key[j]);
      }
    }
  }
  return out;
}

function mergeRanges(ranges: readonly CharRange[]): CharRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: CharRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start < last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      out.push({ start: r.start, end: r.end });
    }
  }
  return out;
}

/**
 * Finds the characters in a host that imitate brand letters, such as the "1" in "paypa1",
 * "rn" in "arnazon" or Cyrillic letters. Returns no ranges when the host uses a brand name
 * with real letters, or is not a lookalike at all.
 */
export function lookalikeParts(host: string): CharRange[] {
  const match = findBrandLookalike(host);
  if (!match) {
    return [];
  }
  const ranges: CharRange[] = [];
  if (match.kind === 'foreign-script') {
    let index = 0;
    for (const cp of host) {
      if (cp.charCodeAt(0) > 0x7f) ranges.push({ start: index, end: index + cp.length });
      index += cp.length;
    }
    return mergeRanges(ranges);
  }
  const labels = host.split('.');
  const nameLabels = Math.max(0, labels.length - suffixLabelCount(labels.map((l) => l.toLowerCase())));
  let offset = 0;
  labels.forEach((label, i) => {
    if (i < nameLabels) {
      ranges.push(...partsInPiece(label, offset));
      let pieceOffset = offset;
      for (const piece of label.split('-')) {
        if (piece !== label) ranges.push(...partsInPiece(piece, pieceOffset));
        pieceOffset += piece.length + 1;
      }
    }
    offset += label.length + 1;
  });
  return mergeRanges(ranges);
}