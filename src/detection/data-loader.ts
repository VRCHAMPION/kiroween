import type { DetectionData } from './data-bundle';

let loaded: DetectionData | undefined;
let pending: Promise<void> | undefined;

/**
 * Loads the heavy detection data (Public Suffix List, confusables, famous-site list) once.
 * The promise never rejects: if the chunk cannot load, analysis keeps using the small built-in
 * data (pre-load mode) and the next call tries again.
 */
export function ensureDetectionData(): Promise<void> {
  if (loaded) return Promise.resolve();
  pending ??= import('./data-bundle')
    .then((m) => {
      loaded = m.DATA;
    })
    .catch(() => undefined)
    .then(() => {
      pending = undefined;
    });
  return pending;
}

/** True once the data is in memory. Callers use it to stay synchronous when they can. */
export function isDetectionDataLoaded(): boolean {
  return loaded !== undefined;
}

/** The loaded data, or undefined in pre-load mode. */
export function getData(): DetectionData | undefined {
  return loaded;
}

/** Test helper: forgets the loaded data so pre-load mode can be tested. */
export function resetDetectionDataForTests(): void {
  loaded = undefined;
  pending = undefined;
}
