import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { createAudioContext, playChime } from './chime';

const started = vi.fn();
const created = vi.fn();

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  constructor() {
    created();
  }
  resume() {
    return Promise.resolve();
  }
  createOscillator() {
    return { type: '', frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start: started, stop() {} };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} };
  }
}

beforeEach(() => {
  window.localStorage.clear();
  started.mockClear();
  created.mockClear();
  Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true, writable: true });
});
afterEach(() => {
  Reflect.deleteProperty(window, 'AudioContext');
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.restoreAllMocks();
});

async function openResult(view: 'mortal' | 'haunted') {
  window.localStorage.setItem('phantom-inbox:view', view);
  const user = userEvent.setup();
  const utils = render(<App />);
  await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-kyc-expiry');
  await user.click(screen.getByRole('button', { name: 'Check this message' }));
  return { user, ...utils };
}

describe('Exorcism sound', () => {
  it('is off by default, a 44px-class toggle with aria-pressed, and creates no audio', async () => {
    await openResult('haunted');
    const toggle = screen.getByRole('button', { name: 'Sound: off' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.className).toContain('sound-toggle');
    expect(created).not.toHaveBeenCalled();
  });

  it('stays silent when ticking a step with sound off', async () => {
    const { user } = await openResult('haunted');
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(created).not.toHaveBeenCalled();
    expect(started).not.toHaveBeenCalled();
  });

  it('plays when a step is ticked with sound on, not when it is unticked, and stores nothing', async () => {
    const { user } = await openResult('haunted');
    const before = window.localStorage.length;
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    expect(screen.getByRole('button', { name: 'Sound: on' }).getAttribute('aria-pressed')).toBe('true');
    expect(created).not.toHaveBeenCalled();
    const box = screen.getAllByRole('checkbox')[0];
    await user.click(box);
    expect(started).toHaveBeenCalledTimes(1);
    await user.click(box);
    expect(started).toHaveBeenCalledTimes(1);
    expect(window.localStorage.length).toBe(before);
  });

  it('plays after a successful copy, and stays silent when copying fails', async () => {
    const { user } = await openResult('mortal');
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true });
    await user.click(screen.getByRole('button', { name: 'Copy English warning' }));
    expect(started).toHaveBeenCalledTimes(1);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) }, configurable: true });
    await user.click(screen.getByRole('button', { name: 'Copy English warning' }));
    expect(started).toHaveBeenCalledTimes(1);
  });

  it('stays silent for Share', async () => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.resolve(), configurable: true });
    const { user } = await openResult('mortal');
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    await user.click(screen.getByRole('button', { name: 'Share English warning' }));
    expect(started).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, 'share');
  });

  it('keeps working when the browser has no Web Audio', async () => {
    Reflect.deleteProperty(window, 'AudioContext');
    expect(createAudioContext()).toBeUndefined();
    const { user } = await openResult('haunted');
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByRole('button', { name: 'Sound: on' })).toBeTruthy();
  });

  it('keeps the toggle available with reduced motion and passes axe', async () => {
    window.localStorage.setItem('phantom-inbox:reduced-motion', 'true');
    const { container } = await openResult('haunted');
    expect(screen.getByRole('button', { name: 'Sound: off' })).toBeTruthy();
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  it('playChime never throws, even with a broken context', () => {
    expect(() => playChime({} as AudioContext)).not.toThrow();
  });
});