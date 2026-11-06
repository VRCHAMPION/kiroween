import type { FlagSource, FlagType, RedFlag, Severity } from './types';

export interface FlagParts {
  type: FlagType;
  label: string;
  severity: Severity;
  reason: string;
  source: FlagSource;
  start: number;
  end: number;
  attachmentIndex?: number;
}

/** Builds a red flag and copies the exact flagged words out of the source string. */
export function makeFlag(parts: FlagParts, sourceText: string): RedFlag {
  const index = parts.attachmentIndex ?? '';
  const flag: RedFlag = {
    id: `${parts.type}:${parts.source}:${index}:${parts.start}:${parts.end}`,
    type: parts.type,
    label: parts.label,
    severity: parts.severity,
    reason: parts.reason,
    source: parts.source,
    start: parts.start,
    end: parts.end,
    text: sourceText.slice(parts.start, parts.end),
  };
  if (parts.attachmentIndex !== undefined) {
    flag.attachmentIndex = parts.attachmentIndex;
  }
  return flag;
}