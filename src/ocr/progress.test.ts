import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { toProgress, type LoggerMessage } from './progress';

describe('toProgress examples', () => {
  it('maps each tesseract stage to a friendly stage', () => {
    expect(toProgress({ status: 'loading tesseract core', progress: 0 })).toEqual({ stage: 'loading-reader', percent: 0 });
    expect(toProgress({ status: 'loading language traineddata', progress: 1 })).toEqual({ stage: 'loading-language', percent: 35 });
    expect(toProgress({ status: 'initializing api', progress: 1 })).toEqual({ stage: 'loading-language', percent: 40 });
    expect(toProgress({ status: 'recognizing text', progress: 0.5 })).toEqual({ stage: 'reading', percent: 70 });
    expect(toProgress({ status: 'recognizing text', progress: 1 })).toEqual({ stage: 'reading', percent: 100 });
  });

  it('ignores unknown messages and clamps bad progress values', () => {
    expect(toProgress({ status: 'something else', progress: 0.5 })).toBeUndefined();
    expect(toProgress({ status: 'recognizing text', progress: Number.NaN })?.percent).toBe(40);
    expect(toProgress({ status: 'recognizing text', progress: 7 })?.percent).toBe(100);
  });
});

const ORDER = ['loading tesseract core', 'initializing tesseract', 'loading language traineddata', 'initializing api', 'recognizing text'];

describe('toProgress properties', () => {
  // Feature: screenshot-and-exorcism, Property 7: OCR progress only moves forward within a read
  // Messages arriving in stage order, each with rising progress, never make the overall percent go back.
  it('stays within 0 to 100 and never goes backwards when stages arrive in order', () => {
    const run = fc
      .array(fc.tuple(fc.integer({ min: 0, max: ORDER.length - 1 }), fc.double({ min: 0, max: 1, noNaN: true })), { minLength: 1, maxLength: 40 })
      .map((steps) =>
        [...steps].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([i, p]): LoggerMessage => ({ status: ORDER[i], progress: p })),
      );
    fc.assert(
      fc.property(run, (messages) => {
        let last = -1;
        for (const m of messages) {
          const p = toProgress(m);
          expect(p).toBeDefined();
          const percent = p?.percent ?? -1;
          expect(percent).toBeGreaterThanOrEqual(0);
          expect(percent).toBeLessThanOrEqual(100);
          expect(percent).toBeGreaterThanOrEqual(last);
          last = percent;
        }
      }),
      { numRuns: 300 },
    );
  });
});