import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { analyse } from '../../detection';
import { SAMPLES } from '../../data/samples';
import { exorcismPlan, type Plan } from './plan';
import { banishedCount } from './ritual';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  vi.restoreAllMocks();
});

const planOf = (id: string) => exorcismPlan(analyse(SAMPLES.find((s) => s.id === id) ?? { text: '' })) as Plan;
const exorcism = () => screen.getByRole('region', { name: /What to do now|The Exorcism/ });

async function checkSample(id: string, view: 'mortal' | 'haunted' = 'mortal') {
  window.localStorage.setItem('phantom-inbox:view', view);
  const user = userEvent.setup();
  const utils = render(<App />);
  await user.selectOptions(screen.getByLabelText('Try a sample'), id);
  await user.click(screen.getByRole('button', { name: 'Check this message' }));
  return { user, ...utils };
}

async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('Exorcism: next steps', () => {
  it('shows numbered steps after a likely scam, with our own report links', async () => {
    await checkSample('scam-kyc-expiry');
    const section = exorcism();
    expect(within(section).getByRole('heading', { name: 'What to do now' })).toBeTruthy();
    expect(within(section).getByText('This message is likely a scam. Follow these steps to stay safe.')).toBeTruthy();
    const steps = within(section).getAllByRole('listitem');
    expect(steps).toHaveLength(planOf('scam-kyc-expiry').steps.length);
    expect(section.querySelector('ol.exorcism-steps')).not.toBeNull();
    const portal = within(section).getByRole('link', { name: 'Report at cybercrime.gov.in' });
    expect(portal.getAttribute('href')).toBe('https://cybercrime.gov.in');
    expect(portal.getAttribute('rel')).toBe('noopener noreferrer');
    expect(within(section).getByRole('link', { name: 'Call 1930' }).getAttribute('href')).toBe('tel:1930');
    expect(within(section).queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByTestId('ritual-circle')).toBeNull();
  });

  it('comes right after the verdict and score, before the warning signs', async () => {
    await checkSample('scam-kyc-expiry');
    const panel = screen.getByRole('region', { name: 'Result' });
    const order = [...panel.querySelectorAll('.score, #exorcism, .flag-list')].map((e) => (e.id === 'exorcism' ? 'exorcism' : e.className.split(' ')[0]));
    expect(order).toEqual(['score', 'exorcism', 'flag-list']);
  });

  it('starts with uninstalling the screen-sharing app when one is mentioned', async () => {
    await checkSample('scam-electricity');
    const first = within(exorcism()).getAllByRole('listitem')[0];
    expect(first.textContent).toContain('Do this first');
    expect(first.textContent).toContain('Uninstall any screen-sharing app now');
  });

  it('is not shown for a message that looks safe', async () => {
    await checkSample('genuine-bank-alert');
    expect(screen.queryByRole('region', { name: /What to do now|The Exorcism/ })).toBeNull();
  });
});

describe('Exorcism: family warning', () => {
  it('offers English and Hindi warnings, with Hindi marked as Hindi', async () => {
    await checkSample('scam-digital-arrest');
    const plan = planOf('scam-digital-arrest');
    const section = exorcism();
    const english = [...section.querySelectorAll('.warning-text')].find((e) => !e.hasAttribute('lang'));
    const hindi = section.querySelector('.warning-text[lang="hi"]');
    expect(english?.textContent).toBe(plan.warning.en);
    expect(hindi?.textContent).toBe(plan.warning.hi);
  });

  it('copies a warning and says so', async () => {
    const { user } = await checkSample('scam-upi-refund');
    await user.click(screen.getByRole('button', { name: 'Copy Hindi warning' }));
    expect(await navigator.clipboard.readText()).toBe(planOf('scam-upi-refund').warning.hi);
    expect(within(exorcism()).getAllByRole('status').some((s) => s.textContent === 'Hindi warning copied.')).toBe(true);
  });

  it('selects the text when the browser will not copy', async () => {
    await checkSample('scam-upi-refund');
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Copy English warning' }));
    await vi.waitFor(() => expect(window.getSelection()?.toString()).toBe(planOf('scam-upi-refund').warning.en));
    expect(within(exorcism()).getAllByRole('status').some((s) => /is selected/.test(s.textContent ?? ''))).toBe(true);
  });

  it('shows Share buttons only where the share sheet exists', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const { user } = await checkSample('scam-job-task');
    await user.click(screen.getByRole('button', { name: 'Share English warning' }));
    expect(share).toHaveBeenCalledWith({ text: planOf('scam-job-task').warning.en });
  });

  it('has no Share buttons without a share sheet', async () => {
    await checkSample('scam-job-task');
    expect(screen.queryByRole('button', { name: /^Share / })).toBeNull();
  });
});

describe('Exorcism: the ritual in Haunted view', () => {
  it('keeps every step word for word and adds a read checkbox to each', async () => {
    await checkSample('scam-paypal-homoglyph', 'haunted');
    const section = exorcism();
    expect(within(section).getByRole('heading', { name: 'The Exorcism' })).toBeTruthy();
    expect(within(section).getByText('What to do now')).toBeTruthy();
    const plan = planOf('scam-paypal-homoglyph');
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(plan.steps.length);
    items.forEach((item, i) => {
      expect(item.querySelector('.step-title')?.textContent).toBe(plan.steps[i].title);
      expect(item.querySelector('.step-detail')?.textContent).toBe(plan.steps[i].detail);
    });
    expect(within(section).getAllByRole('checkbox', { name: 'I have read this step' })).toHaveLength(plan.steps.length);
    expect(screen.getByTestId('ritual-circle').getAttribute('aria-hidden')).toBe('true');
  });

  it('banishes ghosts as steps are read, and says when they are all gone', async () => {
    const { user, container } = await checkSample('scam-bank-link-mismatch', 'haunted');
    const flags = analyse(SAMPLES.find((s) => s.id === 'scam-bank-link-mismatch') ?? { text: '' }).flags.length;
    const ghosts = Math.min(12, flags);
    const boxes = within(exorcism()).getAllByRole('checkbox');
    const total = boxes.length;
    expect(screen.getAllByTestId('ritual-ghost')).toHaveLength(ghosts);
    expect(container.querySelectorAll('.ritual-ghost.is-banished')).toHaveLength(0);

    for (let i = 0; i < total; i += 1) {
      await user.click(boxes[i]);
      const banished = banishedCount(i + 1, total, ghosts);
      expect(container.querySelectorAll('.ritual-ghost.is-banished')).toHaveLength(banished);
      const status = exorcism().querySelector('.ritual-progress')?.textContent;
      if (i + 1 < total) expect(status).toBe(`${i + 1} of ${total} steps read. ${banished} of ${ghosts} ghosts banished.`);
    }
    expect(exorcism().querySelector('.ritual-progress')?.textContent).toBe('The ghosts are banished. Stay safe.');
    expect(await violations(container)).toEqual([]);

    await user.click(boxes[0]);
    expect(container.querySelectorAll('.ritual-ghost.is-banished').length).toBeLessThan(ghosts);
  });

  it('starts a fresh ritual for each new check', async () => {
    const { user } = await checkSample('scam-kyc-expiry', 'haunted');
    await user.click(within(exorcism()).getAllByRole('checkbox')[0]);
    await user.selectOptions(screen.getByLabelText('Try a sample'), 'scam-job-task');
    await user.click(screen.getByRole('button', { name: 'Check this message' }));
    expect(within(exorcism()).getAllByRole('checkbox').every((b) => !(b as HTMLInputElement).checked)).toBe(true);
  });

  it('has no axe violations in Mortal view with the next steps shown', async () => {
    const { container } = await checkSample('scam-digital-arrest');
    expect(await violations(container)).toEqual([]);
  });
});