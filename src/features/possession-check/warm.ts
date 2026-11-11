import { ensureDetectionData } from '../../detection';

/** Starts loading the heavy checking data when the browser is idle, after the first paint. Never throws. */
export function warmDetection(): void {
  const start = () => {
    void ensureDetectionData();
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start);
  } else {
    setTimeout(start, 0);
  }
}
