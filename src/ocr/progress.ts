import type { OcrProgress, OcrStage } from './types';

export interface LoggerMessage {
  status: string;
  progress: number;
}

/**
 * Each tesseract status gets its own slice of the bar, in the order tesseract sends them, so
 * the bar only moves forward. Recognising takes most of the time.
 */
const STAGES: readonly { stage: OcrStage; match: RegExp; from: number; to: number }[] = [
  { stage: 'loading-reader', match: /loading tesseract core/i, from: 0, to: 15 },
  { stage: 'loading-reader', match: /initiali[sz](?:ing|ed) tesseract/i, from: 15, to: 25 },
  { stage: 'loading-language', match: /load(?:ing|ed) language/i, from: 25, to: 35 },
  { stage: 'loading-language', match: /initiali[sz](?:ing|ed) api/i, from: 35, to: 40 },
  { stage: 'reading', match: /recogni[sz]ing text/i, from: 40, to: 100 },
];

/** Turns a tesseract logger message into one overall progress value, or undefined if unknown. */
export function toProgress(message: LoggerMessage): OcrProgress | undefined {
  const step = STAGES.find((s) => s.match.test(message.status));
  if (!step) return undefined;
  const p = Number.isFinite(message.progress) ? Math.min(1, Math.max(0, message.progress)) : 0;
  return { stage: step.stage, percent: Math.round(step.from + (step.to - step.from) * p) };
}