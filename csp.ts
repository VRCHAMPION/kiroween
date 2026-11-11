export const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'";
/**
 * Policy for the OCR worker script (served from /ocr/ with this header on the hosting platform).
 * A worker started from a same-origin URL gets its own policy from its response headers, not the page's.
 * It must read the language data from this site (connect-src 'self') and compile WebAssembly
 * ('wasm-unsafe-eval'); everything else stays shut.
 */
export const OCR_WORKER_CSP =
  "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
