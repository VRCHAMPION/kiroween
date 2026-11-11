import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

beforeEach(() => {
  window.localStorage.clear();
});

async function violationsFor(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    // jsdom cannot compute rendered colour; tokens.test.ts covers contrast.
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations;
}

describe('App shell', () => {
  it('shows the not-a-guarantee note in a footer in both views', () => {
    const { container, unmount } = render(<App />);
    const text = 'Not a guarantee. When in doubt, call your bank on the number on your card.';
    expect(container.querySelector('footer')?.textContent).toBe(text);
    unmount();
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    render(<App />);
    expect(screen.getByText(text).closest('footer')).not.toBeNull();
  });

  it('shows the product name and pitch', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Phantom Inbox' })).toBeTruthy();
    expect(screen.getByText('Every scam has a ghost hiding in it. Phantom Inbox makes it visible.')).toBeTruthy();
  });

  it('has no axe violations in Mortal view', async () => {
    const { container } = render(<App />);
    expect(container.querySelector('[data-view="mortal"]')).not.toBeNull();
    expect(await violationsFor(container)).toEqual([]);
  });

  it('has no axe violations in Haunted view', async () => {
    window.localStorage.setItem('phantom-inbox:view', 'haunted');
    const { container } = render(<App />);
    expect(container.querySelector('[data-view="haunted"]')).not.toBeNull();
    expect(await violationsFor(container)).toEqual([]);
  });

  it('switches Mortal to Haunted and back with the toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const root = () => container.querySelector('.app') as HTMLElement;
    const toggle = screen.getByRole('switch', { name: 'Haunted view' });

    expect(root().dataset.view).toBe('mortal');
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    await user.click(toggle);
    expect(root().dataset.view).toBe('haunted');
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    await user.click(toggle);
    expect(root().dataset.view).toBe('mortal');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('activates the toggle with Enter and Space', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const root = () => container.querySelector('.app') as HTMLElement;
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Haunted view' }));
    await user.keyboard('{Enter}');
    expect(root().dataset.view).toBe('haunted');
    await user.keyboard(' ');
    expect(root().dataset.view).toBe('mortal');
  });

  it('persists the view and the reduced-motion setting', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(screen.getByRole('switch', { name: 'Haunted view' }));
    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    first.unmount();
    const { container } = render(<App />);
    const root = container.querySelector('.app') as HTMLElement;
    expect(root.dataset.view).toBe('haunted');
    expect(root.dataset.reducedMotion).toBe('true');
  });
});