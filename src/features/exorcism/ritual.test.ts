import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { banishedCount } from './ritual';

describe('banishedCount examples', () => {
  it('banishes ghosts in proportion', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((read) => banishedCount(read, 7, 5))).toEqual([0, 0, 1, 2, 2, 3, 4, 5]);
    expect(banishedCount(3, 3, 9)).toBe(9);
    expect(banishedCount(2, 4, 0)).toBe(0);
  });
});

describe('banishedCount properties', () => {
  // Feature: screenshot-and-exorcism, Property 5: Ghosts are banished in order and all at the end
  // Reading more steps never brings a ghost back, none leave before reading, and all leave when every step is read.
  it('never decreases, starts at 0 and ends with every ghost banished', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 0, max: 30 }), (steps, ghosts) => {
        let last = 0;
        for (let read = 0; read <= steps; read += 1) {
          const n = banishedCount(read, steps, ghosts);
          expect(n).toBeGreaterThanOrEqual(last);
          expect(n).toBeLessThanOrEqual(ghosts);
          last = n;
        }
        expect(banishedCount(0, steps, ghosts)).toBe(0);
        expect(banishedCount(steps, steps, ghosts)).toBe(ghosts);
      }),
      { numRuns: 300 },
    );
  });
});