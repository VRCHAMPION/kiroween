import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { segmentText, type Span } from './segments';

describe('segmentText examples', () => {
  it('returns the whole text as one plain segment when there are no spans', () => {
    expect(segmentText('hello', [])).toEqual([{ start: 0, end: 5, text: 'hello', covering: [], ending: [] }]);
  });

  it('splits overlapping spans into flat segments', () => {
    const segments = segmentText('refund, approve the collect request', [
      { start: 0, end: 15 },
      { start: 8, end: 35 },
    ]);
    expect(segments.map((s) => [s.text, s.covering, s.ending])).toEqual([
      ['refund, ', [0], []],
      ['approve', [0, 1], [0]],
      [' the collect request', [1], [1]],
    ]);
  });

  it('returns no segments for empty text', () => {
    expect(segmentText('', [{ start: 0, end: 0 }])).toEqual([]);
  });
});

const textAndSpans = fc.string({ maxLength: 60 }).chain((text) =>
  fc.tuple(
    fc.constant(text),
    fc.array(
      fc
        .tuple(fc.integer({ min: 0, max: text.length }), fc.integer({ min: 0, max: text.length }))
        .map(([a, b]): Span => ({ start: Math.min(a, b), end: Math.max(a, b) })),
      { maxLength: 8 },
    ),
  ),
);

describe('segmentText properties', () => {
  // Feature: possession-check-ui, Property 1: Segments rebuild the text and mark exactly the covered characters
  // Joining segments gives the text back, and each character is marked by exactly the spans that contain it.
  it('rebuilds the text and marks exactly the covered characters', () => {
    fc.assert(
      fc.property(textAndSpans, ([text, spans]) => {
        const segments = segmentText(text, spans);
        expect(segments.map((s) => s.text).join('')).toBe(text);
        for (const s of segments) {
          expect(s.end).toBeGreaterThan(s.start);
          for (let pos = s.start; pos < s.end; pos += 1) {
            const expected = spans.flatMap((span, i) => (span.start <= pos && pos < span.end ? [i] : []));
            expect(s.covering).toEqual(expected);
          }
        }
      }),
      { numRuns: 300 },
    );
  });

  // Feature: possession-check-ui, Property 2: Every span ends exactly once
  // Each non-empty span is listed as ending in exactly one segment, and that segment ends where the span ends.
  it('lists each non-empty span as ending exactly once', () => {
    fc.assert(
      fc.property(textAndSpans, ([text, spans]) => {
        const segments = segmentText(text, spans);
        spans.forEach((span, i) => {
          const endings = segments.filter((s) => s.ending.includes(i));
          if (span.end > span.start) {
            expect(endings).toHaveLength(1);
            expect(endings[0].end).toBe(span.end);
          } else {
            expect(endings).toHaveLength(0);
          }
        });
      }),
      { numRuns: 300 },
    );
  });
});