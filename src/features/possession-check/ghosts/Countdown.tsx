import { useEffect, useState } from 'react';
import { deadlineOf, formatCountdown, secondsUntilMidnight } from './ghost-effects';

interface CountdownProps {
  /** The flagged deadline words, such as "within 24 hours". */
  text: string;
  /** When true the countdown stays still. */
  frozen: boolean;
}

function startingSeconds(text: string): number {
  const deadline = deadlineOf(text);
  if (deadline === 'midnight') return secondsUntilMidnight(new Date());
  return deadline ?? 0;
}

/**
 * The fake deadline ticking away inside its ghost. It is decoration, so it is hidden from
 * screen readers; the ghost's whisper explains it in words instead.
 */
export function Countdown({ text, frozen }: CountdownProps) {
  const [seconds, setSeconds] = useState(() => startingSeconds(text));
  const done = seconds <= 0;

  useEffect(() => {
    if (frozen || done) return undefined;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [frozen, done]);

  return (
    <span className={done ? 'ghost-countdown is-done' : 'ghost-countdown'} aria-hidden="true" data-testid="ghost-countdown">
      {done ? '00:00:00 \u00b7 nothing happened' : formatCountdown(seconds)}
    </span>
  );
}