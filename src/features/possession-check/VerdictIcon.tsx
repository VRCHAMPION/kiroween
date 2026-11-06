import type { Verdict } from '../../detection';

interface VerdictIconProps {
  verdict: Verdict;
}

/** Shape-coded so the verdict is clear without colour: octagon, triangle, or circle with a tick. */
export function VerdictIcon({ verdict }: VerdictIconProps) {
  if (verdict === 'likely scam') {
    return (
      <svg className="verdict-icon" data-shape="octagon" viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false">
        <polygon className="verdict-icon-shape" points="15,2 33,2 46,15 46,33 33,46 15,46 2,33 2,15" />
        <rect className="verdict-icon-mark" x="21" y="11" width="6" height="17" rx="2" />
        <circle className="verdict-icon-mark" cx="24" cy="35" r="3.5" />
      </svg>
    );
  }
  if (verdict === 'suspicious') {
    return (
      <svg className="verdict-icon" data-shape="triangle" viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false">
        <polygon className="verdict-icon-shape" points="24,2 47,45 1,45" />
        <rect className="verdict-icon-mark" x="21" y="16" width="6" height="15" rx="2" />
        <circle className="verdict-icon-mark" cx="24" cy="38" r="3.5" />
      </svg>
    );
  }
  return (
    <svg className="verdict-icon" data-shape="circle" viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false">
      <circle className="verdict-icon-shape" cx="24" cy="24" r="22" />
      <polyline className="verdict-icon-tick" points="13,25 21,33 36,16" />
    </svg>
  );
}