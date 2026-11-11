/**
 * Pre-load suffix logic: a small hand-made table of second-level labels, used only until the
 * `detection-data` chunk (tldts and the Public Suffix List) has loaded.
 */

/** Second-level labels used under two-letter country endings, such as co.in or gov.in. */
const SECOND_LEVEL = new Set(['co', 'com', 'net', 'org', 'gov', 'ac', 'edu', 'nic', 'res', 'gen', 'firm', 'ind', 'bank']);

/** Number of labels that form the public ending, judged from the small table. */
export function fallbackSuffixLabelCount(labels: readonly string[]): number {
  const n = labels.length;
  if (n >= 3 && labels[n - 1].length === 2 && SECOND_LEVEL.has(labels[n - 2])) {
    return 2;
  }
  return 1;
}
