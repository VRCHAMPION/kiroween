import { getData } from './data-loader';
import { parseDomain } from './domain';
import { levenshtein } from './edit-distance';
import { isIpHost, suffixLabelCount } from './links';
import { confusableFor, normaliseConfusables } from './normalise';
import { isUndecodableLabel, toUnicodeHost } from './punycode';
import { isMixedScript } from './skeleton';
import { findTyposquat, MIN_LENGTH_GENERATED_D1, squatDistance, type SquatTarget } from './typosquat';

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

export { levenshtein };

export type LookalikeMatch =
  | { kind: 'brand'; brand: Brand; imitation: boolean; decoded?: string }
  /** A famous site from the generated list, copied with look-alike letters. */
  | { kind: 'homograph'; domain: string; targetName: string; decoded?: string }
  /** A curated brand name placed in front of a different registrable domain. */
  | { kind: 'brand-in-subdomain'; brand: Brand; registrable: string }
  /** A small spelling change away from a curated or famous name. */
  | { kind: 'typosquat'; domain: string; brandName?: string; targetName: string; decoded?: string }
  /** Letters from two alphabets in one name, or an encoded name that cannot be read. */
  | { kind: 'foreign-script'; undecodable: boolean; decoded?: string };

interface TargetSets {
  /** Curated keys first, then generated names of 6 or more characters. */
  targets: SquatTarget[];
  /** Generated famous names (6 or more characters) to their domain. */
  generated: Map<string, string>;
  /** Every registrable domain that is a real brand site. */
  official: Set<string>;
}

const CURATED_OFFICIAL = new Set(BRANDS.flatMap((b) => b.official));
const CURATED_TARGETS: SquatTarget[] = BRANDS.flatMap((b) =>
  b.keys.map((key) => ({ name: key, domain: b.official[0], brandName: b.name, curated: true })),
);
const PRE_LOAD: TargetSets = { targets: CURATED_TARGETS, generated: new Map(), official: CURATED_OFFICIAL };
let cached: { source: readonly string[]; sets: TargetSets } | undefined;

/** The comparison lists. Before the detection data has loaded only the curated brands are used. */
function targetSets(): TargetSets {
  const data = getData();
  if (!data) return PRE_LOAD;
  if (cached?.source === data.topBrands) return cached.sets;
  const generated = new Map<string, string>();
  const targets = [...CURATED_TARGETS];
  for (const domain of data.topBrands) {
    if (CURATED_OFFICIAL.has(domain)) continue;
    const name = parseDomain(domain).name;
    if (name.length < MIN_LENGTH_GENERATED_D1 || !/^[a-z0-9-]+$/.test(name)) continue;
    // Both sides of every comparison are skeletons, so a name with "rn" in it still matches its look-alike.
    const flat = normaliseConfusables(name);
    if (!generated.has(flat)) generated.set(flat, domain);
    targets.push({ name: flat, domain, curated: false });
  }
  const sets = { targets, generated, official: new Set([...CURATED_OFFICIAL, ...data.topBrands]) };
  cached = { source: data.topBrands, sets };
  return sets;
}

/** Checks whether a host imitates a known brand or hides foreign look-alike letters. Never throws. */
export function findBrandLookalike(host: string): LookalikeMatch | undefined {
  try {
    return lookupBrandLookalike(host);
  } catch {
    return undefined;
  }
}

function lookupBrandLookalike(host: string): LookalikeMatch | undefined {
  const lower = host.toLowerCase();
  if (lower === '' || isIpHost(lower)) {
    return undefined;
  }
  const sets = targetSets();
  const parsed = parseDomain(lower);
  // A brand's own domain (raw text, not skeleton) is never a lookalike of itself.
  if (sets.official.has(parsed.registrable)) {
    return undefined;
  }
  const unicodeHost = toUnicodeHost(parsed.host);
  const decoded = unicodeHost !== parsed.host ? unicodeHost : undefined;
  const labels = unicodeHost.split('.');
  const nameCount = Math.max(0, labels.length - suffixLabelCount(labels));
  const names = labels.slice(0, nameCount);

  // A curated brand written out as a whole label in front of another registrable domain.
  const subdomain = parseDomain(unicodeHost).subdomain;
  if (subdomain !== '') {
    for (const label of subdomain.split('.')) {
      const folded = normaliseConfusables(label);
      const brand = BRANDS.find((b) => b.keys.includes(folded));
      if (brand) {
        return { kind: 'brand-in-subdomain', brand, registrable: parsed.registrable };
      }
    }
  }

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
            return { kind: 'brand', brand, imitation: raw !== key && !raw.includes(key), decoded };
          }
        }
      }
    }
  }

  // The registrable name of the host, judged on its skeleton (look-alike letters folded to Latin).
  const name = parseDomain(unicodeHost).name;
  const flat = normaliseConfusables(name);
  if (flat !== name) {
    const domain = sets.generated.get(flat);
    if (domain) {
      return { kind: 'homograph', domain, targetName: flat, decoded };
    }
  }
  const squat = findTyposquat(flat, sets.targets);
  if (squat) {
    const target = sets.targets.find((t) => t.domain === squat.domain && squatDistance(flat, t) === squat.distance);
    return { kind: 'typosquat', domain: squat.domain, brandName: squat.brandName, targetName: target?.name ?? flat, decoded };
  }

  const undecodable = lower.split('.').some(isUndecodableLabel);
  if (undecodable || labels.some(isMixedScript)) {
    return { kind: 'foreign-script', undecodable, decoded };
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
      const mapped = confusableFor(ch) ?? ch;
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

/** Positions of `a` that must change to become `b` (changed, extra, or next to a missing letter). */
function changedPositions(a: string, b: string): Set<number> {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  const changed = new Set<number>();
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] !== b[j - 1]) changed.add(i - 1);
      i -= 1;
      j -= 1;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      changed.add(i - 1);
      i -= 1;
    } else {
      // A letter is missing here: mark the letter next to the gap.
      if (a.length > 0) changed.add(Math.min(i, a.length - 1));
      j -= 1;
    }
  }
  return changed;
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
 * with real letters, or is not a lookalike at all. Encoded `xn--` names are marked whole.
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
    let offset = 0;
    for (const label of host.split('.')) {
      if (/^xn--/i.test(label)) ranges.push({ start: offset, end: offset + label.length });
      offset += label.length + 1;
    }
    return mergeRanges(ranges);
  }
  const labels = host.split('.');
  const nameLabels = Math.max(0, labels.length - suffixLabelCount(labels.map((l) => l.toLowerCase())));
  const registrableIndex = nameLabels - 1;
  let offset = 0;
  labels.forEach((label, i) => {
    if (i < nameLabels) {
      if (/^xn--/i.test(label)) {
        ranges.push({ start: offset, end: offset + label.length });
      } else if (match.kind === 'homograph') {
        if (i === registrableIndex) {
          for (const f of foldWithMap(label)) if (f.changed) ranges.push({ start: offset + f.start, end: offset + f.end });
        }
      } else if (match.kind === 'typosquat') {
        if (i === registrableIndex) {
          const folded = foldWithMap(label);
          for (const at of changedPositions(folded.map((f) => f.c).join(''), match.targetName)) {
            ranges.push({ start: offset + folded[at].start, end: offset + folded[at].end });
          }
        }
      } else {
        ranges.push(...partsInPiece(label, offset));
        let pieceOffset = offset;
        for (const piece of label.split('-')) {
          if (piece !== label) ranges.push(...partsInPiece(piece, pieceOffset));
          pieceOffset += piece.length + 1;
        }
      }
    }
    offset += label.length + 1;
  });
  return mergeRanges(ranges);
}
