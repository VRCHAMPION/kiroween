/**
 * The OCR files Phantom Inbox serves from its own origin, so screenshots are read with no CDN.
 * The Vite config copies each `source` (relative to node_modules) to `path` in the build, and the
 * app loads them from the same paths. Nothing here is imported by the browser bundle except the
 * path constants.
 */
export const OCR_DIR = 'ocr';
export const OCR_WORKER = `${OCR_DIR}/worker.min.js`;
export const OCR_CORE_DIR = `${OCR_DIR}/core`;
export const OCR_LANG_DIR = `${OCR_DIR}/lang`;

export interface OcrAsset {
  /** Path served by the app, relative to its base URL. */
  path: string;
  /** File inside node_modules. */
  source: string;
  contentType: string;
}

const JS = 'text/javascript; charset=utf-8';

export const OCR_ASSETS: readonly OcrAsset[] = [
  { path: OCR_WORKER, source: 'tesseract.js/dist/worker.min.js', contentType: JS },
  // LSTM-only cores: tesseract picks the one this device can run, so only one is downloaded.
  { path: `${OCR_CORE_DIR}/tesseract-core-lstm.wasm.js`, source: 'tesseract.js-core/tesseract-core-lstm.wasm.js', contentType: JS },
  { path: `${OCR_CORE_DIR}/tesseract-core-simd-lstm.wasm.js`, source: 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js', contentType: JS },
  {
    path: `${OCR_CORE_DIR}/tesseract-core-relaxedsimd-lstm.wasm.js`,
    source: 'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
    contentType: JS,
  },
  // English LSTM model, integer-quantised: about a quarter the size of the full model.
  { path: `${OCR_LANG_DIR}/eng.traineddata.gz`, source: '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', contentType: 'application/gzip' },
];