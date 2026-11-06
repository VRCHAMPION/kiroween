import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { urgencyThreats } from './urgency-threats';

describe('urgency-threats rule', () => {
  it('flags deadlines and pressure words as urgency', () => {
    const flags = run(urgencyThreats, 'Reply within 24 hours. Act now! Pay today itself. Final notice.');
    expect(flags.every((f) => f.type === 'urgency')).toBe(true);
    expect(spans(flags)).toEqual(['within 24 hours', 'Act now', 'today itself', 'Final notice']);
  });

  it('flags blocked accounts as a medium threat and arrest as a high threat', () => {
    const flags = run(urgencyThreats, 'Your account will be blocked. A police case and arrest warrant are ready.');
    expect(flags.map((f) => [f.type, f.text, f.severity])).toEqual([
      ['threat', 'account will be blocked', 'medium'],
      ['threat', 'police case', 'high'],
      ['threat', 'arrest warrant', 'high'],
    ]);
  });

  it('does not flag calm everyday text', () => {
    expect(run(urgencyThreats, 'The train was 20 minutes late. I will call you after dinner.')).toEqual([]);
  });
});