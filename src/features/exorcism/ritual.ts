/**
 * How many ritual ghosts are banished after `read` of `steps` steps are read. Ghosts leave one by
 * one in proportion: none at the start, all of them once every step is read, never coming back.
 */
export function banishedCount(read: number, steps: number, ghosts: number): number {
  if (steps <= 0 || ghosts <= 0) return 0;
  const r = Math.min(steps, Math.max(0, Math.floor(read)));
  return Math.floor((r * ghosts) / steps);
}

/** The most ghosts drawn in the ritual circle, so a long list of flags still fits on a phone. */
export const MAX_RITUAL_GHOSTS = 12;