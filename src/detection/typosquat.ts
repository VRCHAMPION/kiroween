import { levenshtein } from './edit-distance';

/**
 * A famous name that other names are compared with.
 * `curated` targets are the hand-made India-focused brands; the rest come from the generated famous-site list.
 */
export interface SquatTarget {
  /** The registrable name without its ending, as a skeleton, such as "hdfcbank". */
  name: string;
  /** The real registrable domain, such as "hdfcbank.com". */
  domain: string;
  /** Display name for curated brands, such as "HDFC Bank". */
  brandName?: string;
  curated: boolean;
}

export interface TyposquatHit {
  domain: string;
  brandName?: string;
  distance: 1 | 2;
}

/** Names shorter than this are never compared with a curated brand at distance 1. */
export const MIN_LENGTH_CURATED_D1 = 5;
/** Names shorter than this are never compared with a generated famous site at distance 1. */
export const MIN_LENGTH_GENERATED_D1 = 6;
/** Names shorter than this are never compared when one letter is changed and the length stays the same. */
export const MIN_LENGTH_SAME_LENGTH_D1 = 8;
/** Names shorter than this are never compared at distance 2. */
export const MIN_LENGTH_D2 = 8;
/** Pairs whose lengths differ by more than this are skipped without computing the distance. */
export const MAX_LENGTH_GAP = 2;

/**
 * Whether `candidate` is a small spelling change away from `target`. Both are skeletons (lower-case).
 * Returns the distance (1 or 2) or undefined. Equal names are not a typosquat: they are handled elsewhere.
 */
export function squatDistance(candidate: string, target: SquatTarget): 1 | 2 | undefined {
  const a = candidate;
  const b = target.name;
  if (a === b || Math.abs(a.length - b.length) > MAX_LENGTH_GAP) return undefined;
  const d = levenshtein(a, b);
  if (d === 1) {
    // Changing one letter of a short word gives another real word (ample/apple, forges/forbes), so a
    // same-length change needs long names. An added or dropped letter (githubb/github) is the usual typo.
    const min = a.length === b.length ? MIN_LENGTH_SAME_LENGTH_D1 : target.curated ? MIN_LENGTH_CURATED_D1 : MIN_LENGTH_GENERATED_D1;
    const ok = a.length >= min && b.length >= min && (target.curated || a[0] === b[0]);
    return ok ? 1 : undefined;
  }
  if (d === 2 && a.length >= MIN_LENGTH_D2 && b.length >= MIN_LENGTH_D2 && a[0] === b[0]) return 2;
  return undefined;
}

/** Finds the closest famous name within the thresholds. Curated brands win over generated ones, then the smaller distance. */
export function findTyposquat(candidate: string, targets: readonly SquatTarget[]): TyposquatHit | undefined {
  let best: { target: SquatTarget; distance: 1 | 2 } | undefined;
  for (const target of targets) {
    const distance = squatDistance(candidate, target);
    if (distance === undefined) continue;
    const better =
      !best ||
      (target.curated && !best.target.curated) ||
      (target.curated === best.target.curated && distance < best.distance);
    if (better) best = { target, distance };
  }
  return best && { domain: best.target.domain, brandName: best.target.brandName, distance: best.distance };
}
