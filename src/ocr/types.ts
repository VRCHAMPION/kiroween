/** Where the screenshot reader is, in the order a read goes through. */
export type OcrStage = 'starting' | 'loading-reader' | 'loading-language' | 'reading';

export interface OcrProgress {
  stage: OcrStage;
  /** Overall progress of the whole read, 0 to 100. */
  percent: number;
}

/**
 * Reads the text in a screenshot. The real one uses tesseract.js; tests pass a fake.
 * Rejects with OcrCancelled when the signal aborts.
 */
export type OcrReader = (image: Blob, onProgress: (progress: OcrProgress) => void, signal: AbortSignal) => Promise<string>;

export class OcrCancelled extends Error {
  constructor() {
    super('Reading was stopped.');
    this.name = 'OcrCancelled';
  }
}

export class OcrFailed extends Error {
  constructor(cause?: unknown) {
    super('The screenshot could not be read.');
    this.name = 'OcrFailed';
    this.cause = cause;
  }
}