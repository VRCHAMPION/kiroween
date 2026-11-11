# Implementation Plan: Open-Source Boosts

## Overview

TypeScript (strict). Pure engine code with generated data files in one lazy chunk (`detection-data`), plus dev-only scripts. Order: baseline and licences, lazy data plumbing and real-domain parsing, homograph, typosquat, property tests, eval, polish, power, hook, docs, finish. Tick each box as the task is done. A task that hits an unclear or unread licence applies the SKIP default from the design's Evidence table and reports it; it is not worked around. Bundle gates, measured by `scripts/size-report.mjs`: first-paint files (those referenced by `dist/index.html`) add at most 25 kB gzip, and the `detection-data` chunk is at most 75 kB gzip on its own line.

## Tasks

- [x] 0. Baseline and licence records
  - [x] 0.1 Take the baseline from `.agents/tasks/osb/baseline.md` (main JS 99.10 kB gzip, CSS 6.20 kB, chunks listed there, 821 tests). Re-run `npm run build` to confirm it still matches and record any difference.
    - _Requirements: 10.1_
  - [x] 0.2 Create `THIRD_PARTY_NOTICES.md` with the existing entries (Creepster OFL, tesseract.js and core Apache-2.0, eng traineddata) from `public/licenses/`, plus a licence table with an Evidence column (read in package, read on page with date, NOT yet read) and the SKIP default per unread row, copied from the design. Later tasks replace `NOT yet read` by the verbatim sentence and date.
    - _Requirements: 9.1, 9.6_
  - [x] 0.3 The conformance test "every dependency is pinned to an exact version" (`/^\d+\.\d+\.\d+$/`) already exists in `tests/repo-conformance.test.ts`; confirm it passes and that `.npmrc` has `save-exact=true`. No new test needed.
    - _Requirements: 9.4_
  - [x] 0.4 Add `scripts/eval` to `tsconfig.json` `include`, `scripts/**/*.ts` to the ESLint Node-globals `files`, and `scripts/**/*.test.ts` to `test.include` in `vite.config.ts` (fs-using tests start with `// @vitest-environment node`). Confirm a deliberate type error in a scratch file under `scripts/eval/` fails `npm run typecheck` and a lint error fails `npm run lint`, then remove the scratch file.
    - _Requirements: 5.5, 5.8, 10.6_
  - [x] 0.5 Update `tests/repo-conformance.test.ts`: the expected script list becomes nine names (`build`, `dev`, `eval`, `gen:brands`, `gen:confusables`, `lint`, `preview`, `test`, `typecheck`); the README regex becomes `/npm run ([a-z:]+)/g` with the expected set gaining `eval`, `gen:confusables`, `gen:brands`; tech.md Stack gains `tldts` and `tsx` and Scripts gains the three new scripts with their real commands (add each package.json script in the task that creates it and update the test then, or add stubs now). Add the `structure.md` line allowing tests next to `scripts/`. Run `npm test -- tests/repo-conformance.test.ts` now and after each later task that adds a script or README text.
    - _Requirements: 9.5_
  - [x] 0.6 Write `scripts/size-report.mjs`: reads `dist/index.html` to find First_Paint_Files (script and stylesheet tags plus modulepreload links), gzips each, prints a table and the total, and prints the `detection-data` chunk on its own line. With `--save <file>` it writes a baseline and with `--baseline <file>` it compares. Exit 1 if (after minus before) over First_Paint_Files exceeds 25 kB, if `index.html` references the `detection-data` chunk, or if the chunk exceeds 75 kB gzip. Immediately run `npm run build` on the still-unchanged engine and `node scripts/size-report.mjs --save .agents/tasks/osb/size-baseline.json` (not committed), BEFORE any `src/` change, so later `--baseline` runs compare against a real file. Confirm `npm run lint` passes on it.
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 1. Lazy detection data and real-domain parsing with tldts
  - [x] 1.1 Run `npm view tldts version license` and pin the version returned (7.4.19, MIT) with `npm install --save-exact tldts@<that version>`. Re-read the licence from the installed package (evidence: read in package); if it is not MIT, do not add it (default: keep the old suffix table, report Req 2 as partly done). Fetch the MPL-2.0 text (from the PSL repo `LICENSE` or `https://www.mozilla.org/MPL/2.0/`) into `public/licenses/mpl-2.0.txt`; if it cannot be fetched, apply the same default. In the notices record: PSL data (MPL-2.0) is compiled into our bundle via tldts (MIT), the MPL-2.0 text is in `public/licenses/`, and the source URLs `https://github.com/publicsuffix/list` and `https://github.com/remusao/tldts` at the pinned version, each with the date and the verbatim sentence read.
    - _Requirements: 2.1, 9.1, 9.2, 9.6_
  - [x] 1.2 Add `data-loader.ts` (`ensureDetectionData`, `getData`), `data-bundle.ts` (imports `tldts`, and later the generated data files) and `domain-fallback.ts` (the old suffix logic). Export `ensureDetectionData` from `src/detection/index.ts`. Name the dynamic-import chunk `detection-data` in `vite.config.ts`. Add `isDetectionDataLoaded()`. EXTEND the existing `src/test-setup.ts` (already in `test.setupFiles`, already runs `cleanup()`) with a `beforeAll` awaiting `ensureDetectionData()`. Run the full test suite: all 821 still pass. Add `data-loader.test.ts`: a failed import resolves without rejecting and a later call retries; the promise is cached.
    - _Requirements: 11.1, 11.2, 11.4_
  - [x] 1.3 Add `domain.ts` (`parseDomain`) with unit tests for IPv4, IPv6, `localhost`, trailing dot, upper case, raw Unicode hosts, `xn--`, `.co.in`, `.gov.in` and `paypal.com.secure-login.xyz`, in loaded mode and in Pre_Load_Mode. Never throws. Expected: Cyrillic `pаypal.com` returns registrable `pаypal.com`, `xn--pypal-4ve.com` returns itself, `дом.рф` returns itself, `paypal.com.secure-login.xyz` returns `secure-login.xyz`. Verify against the installed `tldts` and correct the design table if it differs.
    - _Requirements: 2.2, 2.4, 2.5, 11.5_
  - [x] 1.4 Make `registrableDomain` and `suffixLabelCount` in `links.ts` delegate to `parseDomain` and remove `SECOND_LEVEL` from `links.ts`. Read `risky-tld.ts`, `url-shortener.ts`, `link-text-mismatch.ts` and `ip-link.ts` and switch each to `parseDomain` where it splits labels itself. Add registrable-domain tests to each rule's test file. List every changed old expectation for the journal. Run `npm run build` then `node scripts/size-report.mjs`: the first-paint addition must be within 25 kB, the `detection-data` chunk must exist (tldts about 47 kB gzip) and `index.html` must not reference it.
    - _Requirements: 2.6, 2.7, 10.2, 10.3_
  - [x] 1.5 Wire the loading protocol: `PossessionCheck.check` and the Séance `respond` handler stay synchronous when `isDetectionDataLoaded()` is true and otherwise `await ensureDetectionData()` before the first `analyse()`/`feedbackFor()`; the possession-check feature exports `warmDetection()` from `src/features/possession-check/warm.ts` (path must not contain "detection", see the shell-import test) that calls `ensureDetectionData()` from `requestIdleCallback` (fallback `setTimeout 0`), and `App.tsx` calls it in a mount effect (the shell never imports `src/detection/` itself). Run `tests/repo-conformance.test.ts` to confirm the shell-import test still passes. Add component tests: the first check waits for the data; a second check does not. Add the determinism test in `data-loader.test.ts`: for inputs that need no Detection_Data (curated hits such as `paypa1.com`, plain text) `analyse` gives the same result in Pre_Load_Mode and after load.
    - _Requirements: 11.3, 11.5, 11.6_

- [x] 2. Homograph detection
  - [x] 2.1 Write `scripts/gen-confusables.mjs` and npm script `gen:confusables`. Download `confusables.txt`, READ its header and `https://www.unicode.org/license.txt` (record the verbatim sentence and date; if they do not read as Unicode License v3 or the header has no copyright or terms line, exit 1 and apply the default: no generated data, keep the hand-made stand-ins, report). Extraction rule: keep an entry when the source is a single non-ASCII code point, the lower-cased target matches `^[a-z0-9]{1,2}$`, and one pass is a fixed point (drop an entry whose lower-cased target contains any kept source key). Write `src/detection/data/confusables.ts` atomically with `\uXXXX` escapes and a header (Unicode version, date, URL, licence URL, the copied terms line). Commit `public/licenses/unicode-license-v3.txt`. Import the file from `data-bundle.ts` only. Run `npm run lint` on the script. Add the notices entry.
    - _Requirements: 1.1, 1.2, 9.1, 9.2, 9.6_
  - [x] 2.2 Add `punycode.ts` (RFC 3492 decoder, never throws) with unit tests using the RFC 3492 sample vectors.
    - _Requirements: 1.3, 1.9_
  - [x] 2.3 Add `skeleton.ts` (`skeleton`, `scriptsOf` with Unicode property escapes ignoring `Script=Common` and `Script=Inherited`) and merge the generated map (read through `data-loader.ts`) with the existing stand-ins in `normalise.ts`. Existing normalise tests must still pass. Tests for `scriptsOf`: `bank-1.in` and `café.in` single-script, Latin plus Cyrillic and Latin plus Greek mixed. Run `npm run build` then `node scripts/size-report.mjs` (both gates).
    - _Requirements: 1.1, 1.5, 1.10, 10.2, 10.3_
  - [x] 2.4 Extend `findBrandLookalike` and `lookalike-domain.ts` with kinds `homograph`, `brand-in-subdomain` and `foreign-script` (mixed scripts and undecodable `xn--` only), the severity table from the design, and the sanitised decoded-host text (U+XXXX for control, Cf and bidi characters, 80 character cap). Existing curated hits keep kind `brand`. Update `lookalikeParts` so ranges stay correct for `xn--` hosts. Tests: exact spans, RLO and zero-width input; single-script non-brand host (Devanagari-only `xn--` host) NOT flagged; undecodable `xn--` label flagged; Latin plus Cyrillic flagged; Latin plus Greek flagged; `bank-1.in` and `café.in` NOT flagged; `paypal.com.secure-login.xyz` flagged as brand-in-subdomain; `mail.example.com`, `news.example.org`, `my-office-deals.com` not flagged; `g00gle.com` and `paypa1.com` flagged as `homograph`; a raw-equal brand domain never flagged; Pre_Load_Mode still flags curated hits.
    - _Requirements: 1.4 to 1.7, 1.10, 2.3, 3.1, 3.4_
  - [x] 2.5 Add a test that the generated file header fields exist and that every entry maps to `^[a-z0-9]{1,2}$` with a single non-ASCII source and that `skeleton` is idempotent over the whole map. Add a component or unit test that the Exorcism family warning contains no decoded host or brand text from a message with an `xn--` host.
    - _Requirements: 1.1, 1.2, 1.8_

- [x] 3. Typosquat detection
  - [x] 3.1 Record the Tranco finding as SKIPPED in `THIRD_PARTY_NOTICES.md` (upstream NC and SA components, no stated licence for the list). Do not download or commit any Tranco data.
    - _Requirements: 3.12, 9.1_
  - [x] 3.2 Read the Majestic licence sentence on `https://majestic.com/reports/majestic-million` and record it verbatim with the date. If it is read: write `scripts/gen-brands.mjs` and npm script `gen:brands` (`--top` integer 100 to 5000, default 1000), with a documented `EXCLUDE` deny-list applied before the cut that prints how many rows it dropped; stream the CSV, keep the first N domains, write `src/detection/data/top-brands.ts` atomically with the header (source URL, date, count, CC BY 3.0 attribution with `https://creativecommons.org/licenses/by/3.0/`, SHA-256 of the kept rows); on failure keep the committed file and exit 1. If it cannot be read: do NOT download; write a curated-only `top-brands.ts` by hand (about 60 global brand domains, header says hand-made), skip `gen-brands.mjs`'s download, and report. Import the file from `data-bundle.ts` only. Add the CC BY 3.0 line to `THIRD_PARTY_NOTICES.md` when used. Run `npm run lint` on the script, then `npm run build` and `node scripts/size-report.mjs` (both gates).
    - _Requirements: 3.2, 3.3, 3.11, 9.1, 9.6, 10.2, 10.3_
  - [x] 3.3 Add `typosquat.ts` working on `skeleton(decoded name)` with the thresholds from the design, and tests for distance 1 and 2, the length gates, same-first-letter rule, length gap, exact brand, subdomains, candidate listed in the Brand_List, and different suffix. Add a no-flag list of at least 30 ordinary real domains including `ample.com`, `median.com` and `forges.com`.
    - _Requirements: 3.5 to 3.9_
  - [x] 3.4 Wire typosquat into `findBrandLookalike` and `lookalike-domain.ts` (existing flag type, new reason, medium severity), update `lookalikeParts` for changed characters, and run the sample tests to confirm no genuine sample gets a new high flag. Tests pin the wording: a curated brand names the brand; a generated brand uses the domain only (`... away from google.com, so it may be an imitation of that site.`).
    - _Requirements: 3.5 to 3.10, 10.5_
  - [x] 3.5 Add a header test for `top-brands.ts` (fields, count, hash of the kept rows recomputed and compared; for the curated-only fallback, a header says hand-made), a test that no `EXCLUDE` domain appears in the file, and a test that generated names under 6 characters are never used as homograph targets.
    - _Requirements: 3.1, 3.3_

- [x] 4. Property-based tests
  - [x] 4.1 Add the properties from the design table, each with `numRuns` of at least 100 and a one-sentence comment above, next to the code they test (`links.test.ts`, `domain.test.ts`, `punycode.test.ts`, `skeleton.test.ts`, `typosquat.test.ts`, `analyse.test.ts`, lookalike tests). All run against full Detection_Data through the test setup.
    - **Property 1: Any curated brand domain, or generated brand of 6 or more characters, with one confusable swap is flagged**
    - **Property 2: A legitimate brand domain, `www.` plus it, and its subdomains are never flagged as their own lookalike**
    - **Property 3: Parser, link finder, decoder and `analyse()` never throw on random strings**
    - **Property 4: `analyse()` is deterministic, registrable domain is idempotent, `skeleton` is idempotent, edit distance is symmetric and obeys the triangle inequality**
    - **Validates: Requirements 4.1 to 4.6**
  - [x] 4.2 Add a conformance check that every `fc.assert` in `src/detection/**` has `numRuns` of at least 100.
    - _Requirements: 4.5_

- [x] 5. Evaluation script
  - [x] 5.1 Run `npm view tsx version license`, install `tsx` as an exact dev dependency, read the licence fields of `tsx` and its `esbuild` dependency from the installed packages (evidence: read in package), and add both to the notices. If either is not MIT-compatible, do not add it; default: report Task 5 as skipped.
    - _Requirements: 5.5, 9.1, 9.6_
  - [x] 5.2 Move the `AnalysisInput` building from `PossessionCheck.tsx` (if inline) into a pure `toAnalysisInput(parsed)` in `src/features/possession-check/to-analysis-input.ts` and call it from the screen. Not in `src/email/`. Keep the existing tests green.
    - _Requirements: 5.11_
  - [x] 5.3 First prove the runner: a minimal `scripts/eval/run.ts` that imports `analyse` and `ensureDetectionData` from `src/detection` (extensionless imports) runs under `npm run eval -- --smoke` with `tsx`. Then write `scripts/eval/mbox.ts`, the full `run.ts`, fixtures (original made-up messages: a single message starting with `From a@b.example  Thu Aug 22 12:36:23 2002`, the same message without the envelope line, a `00001.abcdef` style file, and an extension-less multi-message mbox with `>From ` escapes) and `scripts/eval/README.md`. The splitter always drops the `From ` envelope line before `parseEml`. Scan all regular files, detect mbox by the first line, skip `cmds` and files over 20 MB. Add npm script `eval`. Print the table, strict table and skipped files.
    - _Requirements: 5.1 to 5.5_
  - [x] 5.4 Add `eval-data/` to `.gitignore` and to the `it.each([...])` ignore list in `tests/repo-conformance.test.ts` (`.gitignore` describe block). Split the pure logic into `scripts/eval/mbox.ts`, `metrics.ts` and `discover.ts` with `*.test.ts` next to them (run by `npm test` through the `scripts/**/*.test.ts` include from 0.4): file discovery, the mbox splitter (with envelope line, without it with equal parsed headers, `>From ` escapes) and the metric maths (zero denominators).
    - _Requirements: 5.6, 5.8_
  - [x] 5.5 Run `npm run eval`. If `eval-data/` exists, record real numbers. If not, run `npm run eval -- --smoke` and write `docs/EVAL.md` labelled "smoke test on synthetic samples, not the real corpora", with download steps for the Nazario and SpamAssassin corpora. Say real numbers are pending the user's download.
    - _Requirements: 5.7, 5.9, 5.10_

- [x] 6. Design polish
  - [x] 6.1 Confirm Creepster is self-hosted (`dist/assets` has the woff2, CSP `font-src 'self'`, `tokens.test.ts` passes). Keep it. No change.
    - _Requirements: 6.1_
  - [x] 6.2 SKIPPED: Freesound sound. Reason: CC0 files cannot be fetched and verified without a login. Record in the notices and the final report.
    - _Requirements: 6.8_
  - [x] 6.3 Add `chime.ts` and a `SoundToggle` in the Exorcism screen with tests (off by default, user gesture only, no storage, 44px, `aria-pressed`, reduced motion, no Web Audio support, axe). The chime plays only when a step checkbox changes to checked and when Copy reports success; write one test each for ticking (plays), unticking (silent), successful copy (plays), failed copy (silent) and Share (silent).
    - _Requirements: 6.2 to 6.7_

- [x] 7. Kiro power
  - [x] 7.1 Re-fetch https://kiro.dev/docs/powers/create and follow the page exactly as read (spec-time expectation: `plugin.json` required, `POWER.md` legacy). Record the date and the sentence on the required file. Create `powers/phishing-forensics/plugin.json` and the two `SKILL.md` files accordingly. If the page now says otherwise, follow the page and report the deviation. Include the full rule list, test workflow, `gen:confusables`, `gen:brands` and `eval`.
    - _Requirements: 7.1 to 7.4_
  - [x] 7.2 Add a conformance test that checks `plugin.json` fields, that the skill names every file in `src/detection/rules/`, and that every npm script and path in the skills exists.
    - _Requirements: 7.3_
  - [ ] 7.3 Try to see the power from a Kiro tool and confirm it activates on keywords such as "phishing" or "homograph". If it cannot be listed or activated, give the click path (Powers panel, Add Custom Power, Import power from a folder, choose `powers/phishing-forensics`) and report "not confirmed". Do not edit `~/.kiro`.
    - _Requirements: 7.5_

- [x] 8. Hook
  - [x] 8.1 Add `.kiro/hooks/detection-tests.json` (use the Kiro hook tool if present, otherwise write it by hand and say so).
    - _Requirements: 8.1, 8.3_
  - [x] 8.2 Update `tech.md` and `structure.md` hook lists and matchers, and add `detection-tests` to `tests/repo-conformance.test.ts`.
    - _Requirements: 8.2_

- [x] 9. Docs and steering
  - [x] 9.1 Update `tech.md` (Stack: `tldts`, `tsx`; Scripts: `gen:confusables`, `gen:brands`, `eval`; one line that `scripts/gen-*.mjs` use `fetch` at development time only) and `structure.md` (folders `powers/`, `scripts/eval/`, `src/detection/data/`; file `THIRD_PARTY_NOTICES.md`). Extend the conformance test's folder list to match, and run it.
    - _Requirements: 8.2, 9.1, 9.5_

- [x] 10. Finish
  - [x] 10.1 Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. All must pass. Run `node scripts/size-report.mjs`: First_Paint_Files gzip after minus before must be 25 kB or less, `index.html` must not reference `detection-data`, and the `detection-data` chunk must be 75 kB gzip or less (if not, lower `--top` and prune confusables entries; do not move data into the main chunk). Record the test count and the before/after size table (first-paint and lazy chunk lines) for 10.6. Confirm `npm run lint` passes on `scripts/gen-*.mjs`, `scripts/size-report.mjs` and `scripts/eval/*.ts`.
    - _Requirements: 10.1 to 10.6_
  - [x] 10.2 Confirm `csp.ts`, `vercel.json` and `dist/index.html` are unchanged and in sync (the conformance test covers this). Confirm the lazy chunk is served from the same origin under the unchanged `script-src 'self'`.
    - _Requirements: 9.3_
  - [x] 10.3 Run `npm run preview` in the background, run `node scripts/journeys.mjs` and `node scripts/ocr-check.mjs`, confirm no CSP violation, that the `detection-data` chunk loads, and that OCR works, then stop the server. Screenshots stay viewport-sized, well under 8000px per side.
    - _Requirements: 9.3, 11.1_
  - [x] 10.4 Update `docs/kiro-journal.md` (spec, power, hook, property-based tests, eval numbers labelled smoke or real, changed expectations, the DELIBERATE behaviour change that foreign-script is narrowed to mixed-script and undecodable `xn--` labels, the typosquat false-positive trade-off, the lazy `detection-data` design with the bundle before/after table, skipped items), the README (dataset licences including the Majestic CC BY 3.0 line and link if used, npm scripts, eval how-to; keep the conformance regex satisfied) and `THIRD_PARTY_NOTICES.md`.
    - _Requirements: 9.1, 10.5_
  - [ ] 10.5 Commit as "Add open-source detection boosts", staging files by name (never `eval-data/`, `.agents/`, `node_modules`, `dist` or datasets), then `git push origin main` without force.
  - [ ] 10.6 Report: licence table with the Evidence column, bundle before and after (first-paint and lazy chunk), eval results (labelled), test count, skipped items and why, manual steps (download corpora, install the power through the UI).
