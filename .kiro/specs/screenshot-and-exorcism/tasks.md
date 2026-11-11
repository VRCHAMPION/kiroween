# Implementation Plan: Screenshot and Exorcism

## Overview

TypeScript (strict) and React. OCR lives in `src/ocr/`, behind an injectable `OcrReader` so jsdom tests use a fake and a browser script tests the real engine. Exorcism lives in `src/features/exorcism/`, built on a pure `exorcismPlan`.

## Tasks

- [x] 1. OCR assets and build wiring
  - [x] 1.1 Create `ocr-assets.ts` with the served paths and their `node_modules` sources, add it to `tsconfig.json`
    - _Requirements: 2.2, 2.8_
  - [x] 1.2 Add a Vite plugin that emits the OCR_Assets into `dist/ocr/` on build and serves them in dev, and copy the licence texts into `public/licenses/`
    - _Requirements: 2.2, 2.8, 9.2_

- [x] 2. OCR module
  - [x] 2.1 Implement `clean-text.ts`, `progress.ts`, `image-file.ts` and `types.ts`
    - _Requirements: 1.3, 1.4, 3.1, 4.3_
  - [x] 2.2 Write property and example tests for cleaning, progress and file checks
    - **Property 6: OCR text cleaning is idempotent and tidy**
    - **Property 7: OCR progress only moves forward within a read**
    - **Validates: Requirements 3.1, 4.3, 1.3, 1.4**
  - [x] 2.3 Implement `prepare-image.ts` (scale, greyscale, dark-mode invert, Blob fallback) and `ocr.ts` (dynamic import, same-origin paths, `workerBlobURL: false`, `cacheMethod: 'none'`, abort, terminate)
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 4.5_

- [x] 3. Screenshot picker
  - [x] 3.1 Build `ScreenshotPicker` with button, drop zone, preview, Reading_State, Stop reading, and errors; add screen-level image paste; inject `OcrReader` through `PossessionCheck`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 4.5_
  - [x] 3.2 Write component tests with a fake reader: pick, drop, paste, stages announced once, stop, no auto-check, focus, errors, text paste still works
    - _Requirements: 1.1 to 1.5, 3.1 to 3.4, 4.1 to 4.5_

- [x] 4. Exorcism logic
  - [x] 4.1 Implement `plan.ts` (Base_Steps, Flag_Steps, ordering, intro, English and Hindi warnings) and `ritual.ts`
    - _Requirements: 5.3, 5.4, 5.6, 6.1 to 6.7, 7.2, 7.3, 8.3_
  - [x] 4.2 Write property and example tests
    - **Property 1: Every scam or suspicious plan has the base steps, each once**
    - **Property 2: Flag steps appear exactly when their flags do**
    - **Property 3: Safe results get no plan**
    - **Property 4: Family warnings never carry message text and always say how to report**
    - **Property 5: Ghosts are banished in order and all at the end**
    - **Validates: Requirements 5.2, 5.3, 5.6, 6.1 to 6.7, 7.2, 7.3, 8.3**

- [x] 5. Exorcism UI
  - [x] 5.1 Build `Exorcism.tsx` (Mortal list, Haunted ritual with checkboxes and ghost circle, warnings with `lang="hi"`, Copy and Share) and `exorcism.css`; render it in `ResultPanel` after the score
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 7.1, 7.4, 7.5, 7.6, 8.1, 8.2, 8.4, 8.5, 8.6_
  - [x] 5.2 Write component tests: shown only for scam or suspicious, links, flag-driven steps, copy success and fallback, share, ritual progress and banishing, Mortal has no checkboxes, axe in both views
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 7.1, 7.4, 7.5, 7.6, 8.1 to 8.6_

- [x] 6. End-to-end OCR check
  - [x] 6.1 Write `scripts/ocr-check.mjs` that draws a chat screenshot, reads it through the built app in Edge or Chrome with the production CSP, and records the text read, origins, storage and CSP violations
    - _Requirements: 9.1, 9.3_
  - [x] 6.2 Run it, write `docs/ocr-check.md`, and fix anything it finds
    - _Requirements: 9.1, 9.3_

- [x] 7. Docs and delivery
  - [x] 7.1 Update the README (Screenshots, Exorcism, assets and licences), the steering docs and the conformance tests
    - _Requirements: 9.2_
  - [x] 7.2 Run typecheck, lint, test, build and the mobile performance check
    - _Requirements: 9.4_
  - [x] 7.3 Append a journal entry and create one commit
    - _Requirements: 9.5_

## Notes

- tesseract.js defaults would break two rules: it loads from a CDN in a `blob:` worker, and caches language data in IndexedDB. The OCR files are served from `ocr/` with `workerBlobURL: false` and `cacheMethod: 'none'`. `scripts/ocr-check.mjs` confirms this under the production CSP: no other origins, no storage, no CSP violations.
- The first browser check found a `/favicon.ico` 404. An inline SVG ghost icon now fixes it, using `data:`, which the CSP already allows.

- jsdom has no Worker or WebAssembly, so only `scripts/ocr-check.mjs` exercises real OCR. Component tests cover every UI state with a fake reader.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "4.2"] },
    { "id": 2, "tasks": ["3.1", "5.1"] },
    { "id": 3, "tasks": ["3.2", "5.2"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["7.2"] },
    { "id": 8, "tasks": ["7.3"] }
  ]
}
```