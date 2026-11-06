import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { jobTaskScam } from './job-task-scam';

describe('job-task-scam rule', () => {
  it('flags big daily earnings as high severity', () => {
    const flags = run(jobTaskScam, 'Earn \u20b93,000 daily from your phone.');
    expect(spans(flags)).toEqual(['Earn \u20b93,000 daily']);
    expect(flags[0].severity).toBe('high');
  });

  it('flags part-time work and task wording', () => {
    expect(spans(run(jobTaskScam, 'Part-time work from home: like YouTube videos, simple tasks.'))).toEqual([
      'Part-time work',
      'like YouTube videos',
      'simple tasks',
    ]);
  });

  it('does not flag a normal job update', () => {
    expect(run(jobTaskScam, 'Your interview is on Monday at 10 am.')).toEqual([]);
  });
});