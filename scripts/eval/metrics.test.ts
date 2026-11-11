import { describe, expect, it } from 'vitest';
import { metricsOf, percent } from './metrics';

describe('metricsOf', () => {
  it('computes precision, recall and false-positive rate', () => {
    const m = metricsOf({ tp: 8, fp: 2, tn: 18, fn: 2 });
    expect(m.precision).toBeCloseTo(0.8);
    expect(m.recall).toBeCloseTo(0.8);
    expect(m.falsePositiveRate).toBeCloseTo(0.1);
    expect(m.total).toBe(30);
  });

  it('reports n/a when a denominator is zero', () => {
    const m = metricsOf({ tp: 0, fp: 0, tn: 0, fn: 0 });
    expect(m.precision).toBeUndefined();
    expect(m.recall).toBeUndefined();
    expect(m.falsePositiveRate).toBeUndefined();
    expect(percent(m.precision)).toBe('n/a');
    expect(percent(0.5)).toBe('50.0%');
  });
});