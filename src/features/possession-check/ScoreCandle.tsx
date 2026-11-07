import { useId } from 'react';
import { candleWaxHeight } from './ghosts/ghost-effects';

/** Candle geometry in viewBox units. */
const FULL = 96;
const STUB = 8;
const BASE = 136;
const MELT = '1.6s';
const VIEW = '0 0 60 150';

interface ScoreCandleProps {
  score: number;
  /** When false (reduced motion) the candle appears at its final height without melting. */
  animate: boolean;
}

/**
 * The haunt score as a candle that has burned down: full for 0, a stub near 100.
 * Decorative only; the score text and the <meter> carry the value. The flame lives in its own
 * SVG so its flicker animates one element's opacity, which phones run without repainting.
 */
export function ScoreCandle({ score, animate }: ScoreCandleProps) {
  const glowId = `candle${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const wax = candleWaxHeight(score, FULL, STUB);
  const top = BASE - wax;
  const fullTop = BASE - FULL;
  const ease = { calcMode: 'spline', keyTimes: '0;1', keySplines: '0.4 0 0.2 1' } as const;
  const follow = animate ? (
    <animateTransform attributeName="transform" type="translate" from={`0 ${fullTop}`} to={`0 ${top}`} dur={MELT} fill="freeze" {...ease} />
  ) : null;

  return (
    <span className="score-candle" aria-hidden="true" data-testid="score-candle" data-wax={wax}>
      <svg className="candle-body" viewBox={VIEW} focusable="false">
        <ellipse className="candle-plate" cx="30" cy="140" rx="26" ry="6" />
        <rect className="candle-wax" x="18" y={top} width="24" height={wax} rx="3">
          {animate && (
            <>
              <animate attributeName="y" from={fullTop} to={top} dur={MELT} fill="freeze" {...ease} />
              <animate attributeName="height" from={FULL} to={wax} dur={MELT} fill="freeze" {...ease} />
            </>
          )}
        </rect>
        <g transform={`translate(0 ${top})`}>
          {follow}
          <path className="candle-drip" d="M18 3q0-3 3-3h18q3 0 3 3v6q-2 3-4 0v-2q-2 6-5 0q-3 4-5 0v4q-2 3-4 0z" />
          <line className="candle-wick" x1="30" y1="0" x2="30" y2="-7" />
        </g>
      </svg>
      <svg className="candle-light" viewBox={VIEW} focusable="false">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0" className="candle-glow-stop" />
            <stop offset="1" className="candle-glow-stop-out" />
          </radialGradient>
        </defs>
        <g transform={`translate(0 ${top})`}>
          {follow}
          <circle cx="30" cy="-16" r="16" fill={`url(#${glowId})`} />
          <path className="candle-flame" d="M30-30C35-22 37-16 34-11C32.5-8.5 27.5-8.5 26-11C23-16 25-22 30-30Z" />
          <path className="candle-flame-core" d="M30-21C32-17 32.5-14 31-12C30.4-11 29.6-11 29-12C27.5-14 28-17 30-21Z" />
        </g>
      </svg>
    </span>
  );
}