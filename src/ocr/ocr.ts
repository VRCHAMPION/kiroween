import { OCR_CORE_DIR, OCR_LANG_DIR, OCR_WORKER } from '../../ocr-assets';
import { cleanOcrText } from './clean-text';
import { prepareImage } from './prepare-image';
import { toProgress } from './progress';
import { OcrCancelled, OcrFailed, type OcrReader } from './types';

/** Absolute same-origin URL for an OCR asset, correct even when the site lives in a sub-folder. */
const assetUrl = (path: string) => new URL(path, document.baseURI).href;

/**
 * Reads the text in a screenshot with tesseract.js, entirely in this browser.
 * - tesseract.js is loaded only now, with a dynamic import.
 * - The worker, core and English data come from this site's own `ocr/` folder, never a CDN.
 * - The worker starts from a same-origin URL, so the Content-Security-Policy needs no `blob:`.
 * - The language-data cache is off, so nothing is written to IndexedDB.
 * - The image is passed as a Blob, so tesseract never fetches anything for it.
 * - The worker is ended afterwards to free memory.
 */
export const readScreenshot: OcrReader = async (image, onProgress, signal) => {
  if (signal.aborted) throw new OcrCancelled();
  onProgress({ stage: 'starting', percent: 0 });

  let worker: { recognize: (img: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> } | undefined;
  let cancelled = false;
  const onAbort = () => {
    cancelled = true;
    void worker?.terminate();
  };
  signal.addEventListener('abort', onAbort, { once: true });

  try {
    const prepared = await prepareImage(image);
    if (cancelled) throw new OcrCancelled();
    const { createWorker, OEM } = await import('tesseract.js');
    if (cancelled) throw new OcrCancelled();
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: assetUrl(OCR_WORKER),
      corePath: assetUrl(`${OCR_CORE_DIR}/`),
      langPath: assetUrl(OCR_LANG_DIR),
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
      logger: (message: { status: string; progress: number }) => {
        const progress = toProgress(message);
        if (progress && !cancelled) onProgress(progress);
      },
    });
    if (cancelled) throw new OcrCancelled();
    const { data } = await worker.recognize(prepared);
    if (cancelled) throw new OcrCancelled();
    return cleanOcrText(data.text);
  } catch (error) {
    if (cancelled || error instanceof OcrCancelled) throw new OcrCancelled();
    throw new OcrFailed(error);
  } finally {
    signal.removeEventListener('abort', onAbort);
    if (!cancelled) await worker?.terminate().catch(() => undefined);
  }
};