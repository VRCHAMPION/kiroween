import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REDUCED_MOTION_KEY,
  VIEW_KEY,
  parseView,
  readManualReducedMotion,
  readView,
  resolveReducedMotion,
  writeManualReducedMotion,
  writeView,
} from './preferences';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('preferences examples', () => {
  it('defaults to mortal when nothing is stored', () => {
    expect(readView()).toBe('mortal');
  });

  it('treats an unrecognised stored value as mortal', () => {
    window.localStorage.setItem(VIEW_KEY, 'HAUNTED');
    expect(readView()).toBe('mortal');
  });

  it('reads back a saved haunted view', () => {
    writeView('haunted');
    expect(readView()).toBe('haunted');
  });

  it('uses only the two allowed keys', () => {
    writeView('haunted');
    writeManualReducedMotion(true);
    const keys = Object.keys(window.localStorage).sort();
    expect(keys).toEqual([REDUCED_MOTION_KEY, VIEW_KEY].sort());
  });

  it('survives a localStorage that throws on read and write', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(readView()).toBe('mortal');
    expect(readManualReducedMotion()).toBe(false);
    expect(() => writeView('haunted')).not.toThrow();
    expect(() => writeManualReducedMotion(true)).not.toThrow();
  });
});

describe('preferences properties', () => {
  // Feature: phantom-inbox-foundation, Property 3: Only the exact string "haunted" parses to the Haunted view
  // parseView returns haunted only for the exact string haunted and mortal for everything else.
  it('parseView accepts only the exact string haunted', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.anything()), (value) => {
        expect(parseView(value)).toBe(value === 'haunted' ? 'haunted' : 'mortal');
      }),
      { numRuns: 200 },
    );
    expect(parseView('mortal')).toBe('mortal');
    expect(parseView('haunted')).toBe('haunted');
  });

  // Feature: phantom-inbox-foundation, Property 4: Preference write/read round trip uses only the allowed keys
  // Whatever is written can be read back and only the two allowed keys are ever stored.
  it('round-trips preferences using only the allowed keys', () => {
    fc.assert(
      fc.property(fc.constantFrom('mortal' as const, 'haunted' as const), fc.boolean(), (view, manual) => {
        window.localStorage.clear();
        writeView(view);
        writeManualReducedMotion(manual);
        expect(readView()).toBe(view);
        expect(readManualReducedMotion()).toBe(manual);
        for (const key of Object.keys(window.localStorage)) {
          expect([VIEW_KEY, REDUCED_MOTION_KEY]).toContain(key);
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: phantom-inbox-foundation, Property 5: Storage failures fall back to defaults without errors
  // When storage throws, reads return the defaults and writes never throw or log.
  it('falls back to defaults when storage throws', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    fc.assert(
      fc.property(fc.constantFrom('mortal' as const, 'haunted' as const), fc.boolean(), (view, manual) => {
        expect(() => writeView(view)).not.toThrow();
        expect(() => writeManualReducedMotion(manual)).not.toThrow();
        expect(readView()).toBe('mortal');
        expect(readManualReducedMotion()).toBe(false);
      }),
      { numRuns: 100 },
    );
    expect(log).not.toHaveBeenCalled();
  });

  // Feature: phantom-inbox-foundation, Property 6: Reduced motion resolves to true whenever the system requests it
  // Reduced motion is on whenever the system asks for it, otherwise it equals the manual setting.
  it('resolveReducedMotion never lets the manual setting re-enable motion', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (system, manual) => {
        const result = resolveReducedMotion(system, manual);
        if (system) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(manual);
        }
      }),
      { numRuns: 100 },
    );
  });
});