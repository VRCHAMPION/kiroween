import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_SCORE, scoreFlags, verdictFor } from './score';
import { FLAG_TYPES, type FlagType, type Severity } from './types';

const flag = fc.record({
  type: fc.constantFrom<FlagType>(...FLAG_TYPES),
  severity: fc.constantFrom<Severity>('low', 'medium', 'high'),
});

describe('scoreFlags examples', () => {
  it('scores nothing as 0', () => {
    expect(scoreFlags([])).toBe(0);
  });

  it('scores one flag by its severity', () => {
    expect(scoreFlags([{ type: 'urgency', severity: 'low' }])).toBe(10);
    expect(scoreFlags([{ type: 'urgency', severity: 'medium' }])).toBe(25);
    expect(scoreFlags([{ type: 'threat', severity: 'high' }])).toBe(50);
  });

  it('combines different types and counts each type once', () => {
    expect(scoreFlags([{ type: 'threat', severity: 'high' }, { type: 'urgency', severity: 'medium' }])).toBe(63);
    expect(scoreFlags([{ type: 'urgency', severity: 'medium' }, { type: 'urgency', severity: 'medium' }])).toBe(25);
  });

  it('never reaches 100', () => {
    const all = FLAG_TYPES.map((type) => ({ type, severity: 'high' as const }));
    expect(scoreFlags(all)).toBe(MAX_SCORE);
  });

  it('maps scores to verdicts at the thresholds', () => {
    expect(verdictFor(0)).toBe('looks safe');
    expect(verdictFor(24)).toBe('looks safe');
    expect(verdictFor(25)).toBe('suspicious');
    expect(verdictFor(59)).toBe('suspicious');
    expect(verdictFor(60)).toBe('likely scam');
    expect(verdictFor(99)).toBe('likely scam');
  });
});

describe('scoreFlags properties', () => {
  // Feature: detection-engine, Property 1: Score stays within 0 to 100
  // Any list of flags scores an integer from 0 to 100.
  it('is always an integer from 0 to 100', () => {
    fc.assert(
      fc.property(fc.array(flag, { maxLength: 40 }), (flags) => {
        const score = scoreFlags(flags);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 500 },
    );
  });

  // Feature: detection-engine, Property 2: Adding a red flag never lowers the score
  // Adding any flag, anywhere in the list, keeps the score the same or raises it.
  it('never lowers the score when a flag is added', () => {
    fc.assert(
      fc.property(fc.array(flag, { maxLength: 30 }), flag, fc.nat(), (flags, extra, at) => {
        const position = flags.length === 0 ? 0 : at % (flags.length + 1);
        const longer = [...flags.slice(0, position), extra, ...flags.slice(position)];
        expect(scoreFlags(longer)).toBeGreaterThanOrEqual(scoreFlags(flags));
      }),
      { numRuns: 1000 },
    );
  });
});