import { describe, expect, it } from 'vitest';
import { analyse, FLAG_TYPES } from '../detection';
import { SAMPLES } from './samples';

const scams = SAMPLES.filter((s) => s.id.startsWith('scam-'));
const genuine = SAMPLES.filter((s) => s.id.startsWith('genuine-'));

describe('sample messages', () => {
  it('has 10 scams and 5 genuine messages with unique ids', () => {
    expect(SAMPLES).toHaveLength(15);
    expect(scams).toHaveLength(10);
    expect(genuine).toHaveLength(5);
    expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(15);
  });

  it.each(SAMPLES.map((s) => [s.id, s] as const))('%s gets its expected verdict', (_id, sample) => {
    const result = analyse(sample);
    expect(result.verdict, `${sample.id} scored ${result.score}`).toBe(sample.expectedVerdict);
  });

  it.each(scams.map((s) => [s.id, s] as const))('%s triggers its expected flag types', (_id, sample) => {
    const found = new Set(analyse(sample).flags.map((f) => f.type));
    for (const type of sample.expectedFlags) {
      expect(found.has(type), `${sample.id} is missing ${type}`).toBe(true);
    }
  });

  it('the scams together cover every red flag type', () => {
    const covered = new Set(scams.flatMap((s) => s.expectedFlags));
    expect([...FLAG_TYPES].filter((t) => !covered.has(t))).toEqual([]);
  });

  it.each(genuine.map((s) => [s.id, s] as const))('%s has no medium or high flags', (_id, sample) => {
    const strong = analyse(sample).flags.filter((f) => f.severity !== 'low');
    expect(strong.map((f) => `${f.type}: ${f.text}`)).toEqual([]);
  });

  it('includes a genuine bank alert and a genuine delivery update', () => {
    expect(genuine.map((s) => s.id)).toEqual(expect.arrayContaining(['genuine-bank-alert', 'genuine-delivery-update']));
  });

  it('uses only made-up domains for every link and address', () => {
    const allText = SAMPLES.map((s) => [s.text, ...Object.values(s.headers ?? {})].join('\n')).join('\n');
    const hosts = [...allText.matchAll(/(?:https?:\/\/|@)([^\s/<>"]+)/g)].map((m) => m[1].replace(/[.,]$/, ''));
    const fictional = /\.(example|top)$|^(bit\.ly|cutt\.ly)$|^\d+\.\d+\.\d+\.\d+$/;
    expect(hosts.filter((h) => !fictional.test(h))).toEqual([]);
  });
});