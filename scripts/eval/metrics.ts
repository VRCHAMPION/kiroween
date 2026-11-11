export interface Counts {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface Metrics extends Counts {
  total: number;
  /** Each ratio is undefined when its denominator is zero. */
  precision: number | undefined;
  recall: number | undefined;
  falsePositiveRate: number | undefined;
}

const ratio = (a: number, b: number): number | undefined => (b === 0 ? undefined : a / b);

export function metricsOf(c: Counts): Metrics {
  return {
    ...c,
    total: c.tp + c.fp + c.tn + c.fn,
    precision: ratio(c.tp, c.tp + c.fp),
    recall: ratio(c.tp, c.tp + c.fn),
    falsePositiveRate: ratio(c.fp, c.fp + c.tn),
  };
}

export const percent = (value: number | undefined): string => (value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`);