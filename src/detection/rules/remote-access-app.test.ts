import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { remoteAccessApp } from './remote-access-app';

describe('remote-access-app rule', () => {
  it('flags remote-access apps and screen sharing', () => {
    expect(spans(run(remoteAccessApp, 'Install the AnyDesk app. Or use Team Viewer QuickSupport.'))).toEqual([
      'AnyDesk',
      'Team Viewer',
      'QuickSupport',
    ]);
    expect(run(remoteAccessApp, 'Start screen sharing so I can help.')[0].severity).toBe('medium');
  });

  it('does not flag a warning about these apps', () => {
    expect(run(remoteAccessApp, 'We will never ask you to install AnyDesk.')).toEqual([]);
  });
});