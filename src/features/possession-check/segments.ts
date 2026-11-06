export interface Span {
  start: number;
  end: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  /** Indexes of the spans that cover this whole segment. */
  covering: number[];
  /** Indexes of the spans that end exactly where this segment ends. */
  ending: number[];
}

/**
 * Splits text at every span boundary so overlapping highlights can be drawn
 * with plain, non-nested elements. Joining the segment texts gives back the text.
 */
export function segmentText(text: string, spans: readonly Span[]): Segment[] {
  const clamp = (n: number) => Math.min(Math.max(0, n), text.length);
  const valid = spans.map((s) => ({ start: clamp(s.start), end: clamp(s.end) }));
  const cuts = new Set<number>([0, text.length]);
  for (const s of valid) {
    if (s.end > s.start) {
      cuts.add(s.start);
      cuts.add(s.end);
    }
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const covering: number[] = [];
    const ending: number[] = [];
    valid.forEach((s, index) => {
      if (s.end > s.start && s.start <= start && s.end >= end) {
        covering.push(index);
        if (s.end === end) ending.push(index);
      }
    });
    segments.push({ start, end, text: text.slice(start, end), covering, ending });
  }
  return segments;
}