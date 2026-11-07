import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyse, type AnalysisInput } from '../../../detection';
import { ViewContext } from '../../../view-context';
import { HauntedText } from './HauntedText';

afterEach(() => {
  vi.useRealTimers();
});

function renderHaunted(text: string, options: { reducedMotion?: boolean; input?: Partial<AnalysisInput> } = {}) {
  const result = analyse({ text, ...options.input });
  const flags = result.flags.map((flag, i) => ({ flag, number: i + 1 })).filter(({ flag }) => flag.source === 'body');
  const view = render(
    <ViewContext.Provider value={{ view: 'haunted', reducedMotion: options.reducedMotion ?? false }}>
      <HauntedText text={text} flags={flags} />
    </ViewContext.Provider>,
  );
  return { ...view, flags };
}

const ghostButtons = () => screen.getAllByRole('button', { name: /^Red flag \d+ / });
const bubbleOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-describedby') ?? '') as HTMLElement;
const whisperOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls') ?? '') as HTMLElement;
const ghostNamed = (label: RegExp) => screen.getByRole('button', { name: label });

describe('HauntedText ghosts', () => {
  it('puts one labelled ghost after each flagged span', () => {
    const { flags, container } = renderHaunted('Your KYC has expired. Update within 24 hours at https://bit.ly/kyc-99');
    const buttons = ghostButtons();
    expect(buttons).toHaveLength(flags.length);
    buttons.forEach((button, i) => {
      const label = flags[i].flag.label;
      expect(label.length).toBeGreaterThanOrEqual(1);
      expect(label.length).toBeLessThanOrEqual(40);
      expect(button.textContent).toContain(`${flags[i].number} ${label}`);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });
    const firstMark = container.querySelector('mark') as HTMLElement;
    expect(firstMark.textContent).toBe('KYC has expired');
    expect(firstMark.nextElementSibling?.classList.contains('ghost')).toBe(true);
  });

  it('makes the look-alike 1 in paypa1 its own twitching letter', () => {
    const { container } = renderHaunted('Log in at https://paypa1-secure.example/login now');
    expect(screen.getAllByTestId('lookalike-char').map((e) => e.textContent)).toEqual(['1']);
    expect(container.querySelector('mark.kind-lookalike')).not.toBeNull();
  });

  it('marks Cyrillic look-alike letters', () => {
    renderHaunted('Install from https://\u0455b\u0456-yono.example/app');
    expect(screen.getAllByTestId('lookalike-char').map((e) => e.textContent)).toEqual(['\u0455', '\u0456']);
  });

  it('makes pressure and threat words bleed', () => {
    const { container } = renderHaunted('Your account will be blocked immediately.');
    const bleeding = [...container.querySelectorAll('mark.kind-bleed')].map((m) => m.textContent);
    expect(bleeding).toEqual(['account will be blocked', 'immediately']);
  });

  it('keeps message text as plain text', () => {
    const { container } = renderHaunted('<b>bold</b> Your KYC has expired');
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('<b>bold</b>');
  });
});

describe('HauntedText countdown ghost', () => {
  it('counts a fake deadline down and says nothing happened at zero', () => {
    vi.useFakeTimers();
    renderHaunted('Pay within 2 minutes or lose access.');
    const countdown = screen.getByTestId('ghost-countdown');
    expect(countdown.textContent).toBe('00:02:00');
    expect(countdown.getAttribute('aria-hidden')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(countdown.textContent).toBe('00:01:59');
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.getByTestId('ghost-countdown').textContent).toBe('00:00:00 \u00b7 nothing happened');
  });

  it('counts "today itself" down to midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59, 0));
    renderHaunted('Pay today itself.');
    expect(screen.getByTestId('ghost-countdown').textContent).toBe('00:01:00');
  });

  it('stays still in reduced motion', () => {
    vi.useFakeTimers();
    renderHaunted('Pay within 2 minutes or lose access.', { reducedMotion: true });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('ghost-countdown').textContent).toBe('00:02:00');
  });
});

describe('HauntedText True Names', () => {
  const MISMATCH = 'Log in at <a href="http://203.0.113.45/vb/login.php">https://www.vandanabank.example/secure-login</a> today.';

  it('speaks the True Name when the pointer is over the link words, and stops after leaving', () => {
    vi.useFakeTimers();
    const { container } = renderHaunted(MISMATCH);
    const ghost = ghostNamed(/Link text hides real address/);
    const bubble = bubbleOf(ghost);
    expect(bubble.getAttribute('role')).toBe('tooltip');
    expect(bubble.classList.contains('is-visible')).toBe(false);

    const words = [...container.querySelectorAll('mark.kind-link')].find((m) => m.textContent?.includes('vandanabank')) as HTMLElement;
    fireEvent.mouseEnter(words);
    expect(bubble.classList.contains('is-visible')).toBe(true);
    expect(bubble.textContent).toContain('True Name: http://203.0.113.45/vb/login.php');
    expect(within(bubble).getByText('203.0.113.45').tagName).toBe('STRONG');
    expect(bubble.textContent).toContain('The words show vandanabank.example, but the link really opens 203.0.113.45.');

    fireEvent.mouseLeave(words);
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(bubble.classList.contains('is-visible')).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(bubble.classList.contains('is-visible')).toBe(false);
  });

  it('closes the speech bubble with Escape', () => {
    const { container } = renderHaunted(MISMATCH);
    const bubble = bubbleOf(ghostNamed(/Link text hides real address/));
    const words = [...container.querySelectorAll('mark.kind-link')].find((m) => m.textContent?.includes('vandanabank')) as HTMLElement;
    fireEvent.mouseEnter(words);
    expect(bubble.classList.contains('is-visible')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(bubble.classList.contains('is-visible')).toBe(false);
  });

  it('speaks on keyboard focus and stops on blur', () => {
    renderHaunted('Open https://bit.ly/abc now');
    const ghost = ghostNamed(/Shortened link/);
    const bubble = bubbleOf(ghost);
    act(() => ghost.focus());
    expect(bubble.classList.contains('is-visible')).toBe(true);
    expect(within(bubble).getByText('bit.ly').tagName).toBe('STRONG');
    expect(bubble.textContent).toContain('never opens links');
    act(() => ghost.blur());
    expect(bubble.classList.contains('is-visible')).toBe(false);
  });

  it('gives ghosts that are not about links no speech bubble', () => {
    renderHaunted('Your KYC has expired.');
    expect(ghostNamed(/KYC expiry scare/).getAttribute('aria-describedby')).toBeNull();
  });
});

describe('HauntedText whispers', () => {
  it('opens and closes the reason in the text with the ghost button', () => {
    renderHaunted('Your KYC has expired.');
    const ghost = ghostNamed(/KYC expiry scare/);
    const whisper = whisperOf(ghost);
    expect(whisper.hidden).toBe(true);

    fireEvent.click(ghost);
    expect(ghost.getAttribute('aria-expanded')).toBe('true');
    expect(whisper.hidden).toBe(false);
    expect(whisper.textContent).toContain('Banks do not make you update KYC through a link in a message.');
    expect(whisper.textContent).toContain('Strong warning sign');
    expect(within(whisper).getByRole('link', { name: 'Read warning sign 1' }).getAttribute('href')).toBe('#flag-1');

    fireEvent.click(ghost);
    expect(whisper.hidden).toBe(true);
  });

  it('closes with Escape and keeps focus on the ghost', () => {
    renderHaunted('Your KYC has expired.');
    const ghost = ghostNamed(/KYC expiry scare/);
    act(() => ghost.focus());
    fireEvent.click(ghost);
    fireEvent.keyDown(ghost, { key: 'Escape' });
    expect(whisperOf(ghost).hidden).toBe(true);
    expect(ghost.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(ghost);
  });

  it('shows the True Name and the fake deadline note inside whispers', () => {
    renderHaunted('Pay within 1 hour at https://bit.ly/pay-now');
    const shortener = ghostNamed(/Shortened link/);
    fireEvent.click(shortener);
    expect(whisperOf(shortener).textContent).toContain('True Name: https://bit.ly/pay-now');
    const deadline = ghostNamed(/Pressure to act fast/);
    fireEvent.click(deadline);
    expect(whisperOf(deadline).textContent).toContain('It is made up to rush you');
  });
});