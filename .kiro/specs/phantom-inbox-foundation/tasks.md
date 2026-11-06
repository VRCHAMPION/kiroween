# Implementation Plan: Phantom Inbox Foundation

## Overview

Language: TypeScript (strict), fixed by the requirements (React + Vite + TypeScript). No language question was needed.

Order of work: steering documents first (they define the token values, CSP and hook matchers that later tasks copy), then the project configuration, the pure modules and their mandatory tests, the app shell, a mid-way checkpoint, the hooks, journal and README, the repo-conformance tests, and finally a checkpoint that runs every check and creates the single commit.

Conventions for every task:
- Windows PowerShell only. Run commands one per call. Do not chain with `&&`. Use `;` only when a failure of the earlier command does not matter.
- Create text files with the file-writing tool (UTF-8, no BOM). Do not use `Set-Content` or `>` redirection, because PowerShell encodings can corrupt `é` in "Séance".
- All dependency versions are exact (no `^`, `~`, ranges).
- Test files are co-located with the code they test, except `tests/repo-conformance.test.ts`.
- Every PBT uses fast-check with `numRuns` of at least 100 and has a one-sentence comment directly above it stating the property (Requirement 9.2, 9.6). The comment also carries the design tag `// Feature: phantom-inbox-foundation, Property <n>: <property title>`.
- Each of the 10 Correctness Properties in `design.md` has exactly one PBT task, titled with its number and title and citing "Validates: Requirements ...". Only the contrast property that Requirements 9.2 and 9.9 mandate (Property 1, inside task 3.2) is non-optional; the other property tasks are optional (`*`).

Fixed values that several tasks must copy exactly (single source of truth for this plan):

- Hook matchers (JavaScript regex source, shown unescaped; in the JSON files each `\` becomes `\\`):
  - run-tests: `(^|[/\\])src[/\\].*\.tsx?$`
  - rule-tests: `(^|[/\\])src[/\\]detection[/\\]rules[/\\](?![^/\\]*\.test\.ts$)[^/\\]+\.ts$`
  - a11y-check: `(^|[/\\])src[/\\](?!.*\.test\.tsx?$).*\.(tsx|css)$`
  - journal: no matcher
- Content-Security-Policy (identical in `security-privacy.md`, `csp.ts` and the built `dist/index.html`):
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`
- localStorage keys: `phantom-inbox:view` (values `mortal` or `haunted`) and `phantom-inbox:reduced-motion` (values `true` or `false`). No other keys.

## Tasks

- [ ] 1. Steering documents
  - Each file lives directly in `d:\projects\kiroween\.kiro\steering\`, starts on line 1 with a front matter block (`---`, `inclusion: always`, `---`), has at most 200 lines, uses headings and short bullets, and explains any non-obvious term at first use.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 1.1 Write `.kiro/steering/product.md`
    - Sections: Pitch (verbatim "Every scam has a ghost hiding in it. Phantom Inbox makes it visible."), Target users (non-technical adults, elderly parents, scam-awareness learners), Scam categories (KYC expiry, courier/customs fees, electricity bill disconnection, UPI refunds and collect requests, fake job/task offers, "digital arrest").
    - Features: exactly three (Possession Check, Exorcism, Séance), each with a one-sentence purpose of at most 200 characters.
    - Views: Mortal view and Haunted view, 1 to 3 sentences each, plus a statement that the spooky design exists to make the reasons behind each red flag easier to understand.
    - Heading "Non-goals" with one bullet each: backend services, paid APIs, user accounts, message storage, tracking.
    - Statement: no claim of 100% certainty; every result is a risk level with at least 1 reason.
    - Keep the body at or below 10,000 characters.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 6.1 to 6.4_

  - [ ] 1.2 Write `.kiro/steering/design-system.md`
    - Define tokens separately for Mortal and Haunted views, each with at least 6 colour tokens, 3 typography tokens and 4 spacing tokens, with concrete values. Use these token names in both views: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent-flag`, `--color-border`, `--color-focus`, `--font-family`, `--font-size-body`, `--font-size-heading`, `--focus-width`, `--space-1` to `--space-4`.
    - Proposed values (adjust only if the contrast test in task 3.4 shows a failure, and update both files):
      - Mortal: bg `#FFFFFF`, surface `#F4F1EA`, text `#111111`, text-muted `#444444`, accent-flag `#B00020`, border `#595959`, focus `#0B57D0`; body 20px, heading 32px; focus-width 3px; spacing 8/16/24/32px; font `system-ui, "Segoe UI", Arial, sans-serif`.
      - Haunted: bg `#0F0B1A`, surface `#1B1430`, text `#F2EEFF`, text-muted `#C9C0E6`, accent-flag `#FF6B81`, border `#8F84B8`, focus `#FFD166`; body 17px, heading 30px; focus-width 3px; spacing 8/16/24/32px; font `Georgia, "Times New Roman", serif`.
    - Rules: contrast at least 4.5:1 for body text (under 24px, or under 18.66px bold) and at least 3:1 for large text and UI component boundaries (WCAG 2.1 calculation); minimum body size 18px Mortal and 16px Haunted; keyboard operability; visible focus indicator of at least 3:1 contrast and at least 2px thickness; colour never the only signal, and each ghost has a text label of 1 to 40 characters naming the red flag type.
    - Reduced_Motion_Mode: active when `prefers-reduced-motion: reduce` matches or the manual setting is on; replaces looping, parallax, flicker and ghost movement with static presentation; the manual setting can only add reduction and persists across reloads; it cannot re-enable motion while the system requests reduced motion.
    - Haunted effects must not drop flagged words or ghost labels below the thresholds and must leave the explanation text unobscured.
    - _Requirements: 4.1 to 4.9, 6.1 to 6.4_

  - [ ] 1.3 Write `.kiro/steering/security-privacy.md`
    - Statements: no backend and no request carries message content (URL, headers or body); message content is never written to localStorage, sessionStorage, IndexedDB, cookies, URLs, or console and application logs, and the only browser-stored values are the view preference and the reduced-motion preference (name the two keys from the Overview); no analytics, tracking or third-party scripts; no user-facing text claims 100% certainty and results are worded as likelihood or risk level; untrusted message text is rendered as plain text and `innerHTML` / `dangerouslySetInnerHTML` are never used with message content.
    - Include the Content-Security-Policy from the Overview in a code block, with a statement that it contains `connect-src 'none'` and `script-src 'self'` and no `unsafe-inline` or `unsafe-eval`.
    - State that the CSP is delivered by a `<meta http-equiv="Content-Security-Policy">` tag in the production build only, and that the Vite dev server is exempt so `npm run dev` keeps hot module replacement.
    - _Requirements: 5.1 to 5.8, 6.1 to 6.4, 7.9_

  - [ ] 1.4 Write `.kiro/steering/tech.md`
    - Stack list naming each of React, Vite, TypeScript (strict mode), Vitest, fast-check, jsdom, Testing Library, axe-core and ESLint exactly once as a list entry with a one-line role.
    - Scripts: `dev`, `build`, `typecheck`, `lint`, `test`, each with a one-sentence description. Exact commands: `dev` = `vite`, `build` = `vite build`, `typecheck` = `tsc --noEmit`, `lint` = `eslint . --max-warnings 0`, `test` = `vitest --run`. Say that `test` runs once and never starts watch mode.
    - Statements: runtime code makes zero network calls; deployment target is free static hosting (GitHub Pages, Netlify or Cloudflare Pages); every dependency version in `package.json` is pinned to an exact version; every npm script runs unchanged in Windows PowerShell with no POSIX-only syntax (`&&` chaining, `export VAR=value`, `rm -rf`, single-quoted shell globs).
    - Add a "Hooks" section listing all four Hooks with name, trigger and matcher (use the matchers from the Overview; "none" for journal): `run-tests` (PostFileSave), `rule-tests` (PostFileCreate, PostFileSave), `a11y-check` (PostFileCreate, PostFileSave), `journal` (PostTaskExec).
    - _Requirements: 2.1 to 2.7, 10.10, 6.1 to 6.4_

  - [ ] 1.5 Write `.kiro/steering/structure.md`
    - Begin with a level-1 heading right after the front matter.
    - Folder layout: list `src/`, `src/components/`, `src/detection/`, `src/detection/rules/`, `src/styles/`, `docs/`, `.kiro/steering/`, `.kiro/hooks/`, `.kiro/specs/`, each with a one-sentence purpose. Also mention `src/data/` as the future home of sample data only if it fits in one extra line.
    - Test placement: tests for code under `src/` are co-located; top-level `tests/` holds only the Repo_Conformance_Tests (`tests/repo-conformance.test.ts`).
    - Detection rules: live in `src/detection/rules/`; each rule file has exactly one test file named `<rule>.test.ts` in the same folder.
    - Naming conventions with at least one example filename each: components (`PascalCase.tsx`, e.g. `ViewToggle.tsx`), Detection_Rule_Files (`kebab-case.ts`, e.g. `kyc-expiry.ts`), test files (`<name>.test.ts` or `<name>.test.tsx`), style files (`kebab-case.css`, e.g. `tokens.css`).
    - Hook matchers: document the regex of each Hook that has one, copied character for character from the Overview.
    - _Requirements: 3.1 to 3.6, 6.1 to 6.4_

- [ ] 2. Project configuration and tooling
  - [ ] 2.1 Create `package.json` and `.npmrc`, then install dependencies
    - `.npmrc` contains `save-exact=true`.
    - `package.json`: `"name": "phantom-inbox"`, `"private": true`, `"version": "0.1.0"`, `"type": "module"`, `"license": "MIT"`, and exactly the five scripts from task 1.4.
    - Install with exact versions, as separate commands: `npm install --save-exact react react-dom`, then `npm install --save-dev --save-exact vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node vitest jsdom fast-check @testing-library/react @testing-library/dom @testing-library/user-event axe-core eslint @eslint/js typescript-eslint eslint-plugin-react-hooks globals`.
    - Open `package.json` and confirm no version starts with `^` or `~`; fix any that do. Commit-ready `package-lock.json` is produced by the install.
    - _Requirements: 2.6, 7.1, 7.2, 7.6, 7.7, 7.8, 13.3_

  - [ ] 2.2 Create `tsconfig.json`, `csp.ts`, `vite.config.ts`, `src/vite-env.d.ts` and `src/test-setup.ts`
    - `tsconfig.json`: `"strict": true`, `"noEmit": true`, `"jsx": "react-jsx"`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"target": "ES2022"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, `"skipLibCheck": true`, `"types": ["vite/client", "node"]`; `include`: `src`, `tests`, `vite.config.ts`, `csp.ts`.
    - `csp.ts`: `export const CSP = "..."` holding the exact policy from the Overview (no imports, so both Vite and the tests can import it).
    - `vite.config.ts`: import `defineConfig` from `vitest/config`; `base: './'`; React plugin; a small inline plugin with `apply: 'build'` whose `transformIndexHtml` injects `<meta http-equiv="Content-Security-Policy" content={CSP}>` with `injectTo: 'head-prepend'` (so `npm run dev` is unaffected); `test` block with `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']`, `include` for `src/**/*.test.{ts,tsx}` and `tests/**/*.test.ts`.
    - `src/vite-env.d.ts`: `/// <reference types="vite/client" />`.
    - `src/test-setup.ts`: register `afterEach(cleanup)` from `@testing-library/react` (no jest-dom, to keep the stack minimal).
    - Do not add a `public/_headers` file; the meta tag is the only CSP mechanism (Requirement 7.9 says MAY).
    - _Requirements: 7.1, 7.9, 7.12, 9.5, 16.2_

  - [ ] 2.3 Create `eslint.config.js`
    - Flat config using `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended rules, and `globals` for browser (src) and node (config files, tests).
    - Ignore `dist/`, `coverage/` and `node_modules/`. Do not enable `--fix` anywhere.
    - _Requirements: 7.4, 7.11_

  - [ ] 2.4 Create `.gitignore` and `LICENSE`
    - `.gitignore` ignores `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*` and un-ignores `!.env.example`. It must contain no pattern that matches `.kiro/` or anything inside it.
    - `LICENSE`: standard MIT text; the line `Copyright (c) 2026 Phantom Inbox contributors` immediately precedes the permission grant paragraph ("Permission is hereby granted..."), separated by one blank line; no extra terms.
    - _Requirements: 13.1, 13.2, 14.1, 14.2_

- [ ] 3. Core modules and mandatory sample tests
  - [ ] 3.1 Implement `src/styles/contrast.ts`
    - Export `parseHex(hex)`, `relativeLuminance(hex)` and `contrastRatio(a, b)` using the WCAG 2.1 formula. Compute the ratio as `(max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)` so it is exactly symmetric.
    - Reject invalid hex input with a thrown error (callers are tests only).
    - _Requirements: 4.3, 9.8, 9.9_

  - [ ] 3.2 Write `src/styles/contrast.test.ts` (required: Requirement 9 mandates these tests)
    - Example-based tests with specific values: black on white = 21, identical colours = 1, and a known mid-grey pair.
    - **Property 1: Contrast ratio is symmetric and bounded** (PBT, non-optional because Requirements 9.2 and 9.9 mandate it): generate two random colours (three integers 0 to 255 each, formatted `#RRGGBB`); a one-sentence comment above states the property "the contrast ratio is symmetric in its arguments and always lies between 1 and 21". Use `numRuns: 200`. Because floating point can give 21.000000000000004 for black/white, compare the upper bound with a tolerance of `1e-9`.
    - **Validates: Requirements 9.9, 4.3, 9.8**
    - _Requirements: 9.1, 9.2, 9.6, 9.9_

  - [ ] 3.3 Create `src/styles/tokens.css`
    - One block per view, selectors `[data-view='mortal']` and `[data-view='haunted']`, declaring every token with the exact names and values from task 1.2. Use the `--font-family`, `--font-size-*` and `--focus-width` tokens too.
    - _Requirements: 4.2, 4.4, 8.3, 8.13_

  - [ ] 3.4 Write `src/styles/tokens.test.ts` (required)
    - Read `tokens.css` with `node:fs`, parse the two blocks into token maps, and assert for each view: all required token names exist; `--font-size-body` is at least 18px (Mortal) or 16px (Haunted); `--focus-width` is at least 2px.
    - Assert declared pair contrast with `contrastRatio`: text/bg, text/surface, text-muted/bg, text-muted/surface, accent-flag/bg, accent-flag/surface each at least 4.5; border/bg, border/surface and focus/bg, focus/surface each at least 3. Failure messages name the view and pair. jsdom cannot compute rendered colour, so this test is the contrast check.
    - _Requirements: 4.3, 4.4, 4.5, 8.13, 9.8_

  - [ ] 3.5 Implement `src/preferences.ts`
    - Export `type View = 'mortal' | 'haunted'`, `parseView(value: unknown): View` (anything other than the exact strings returns `'mortal'`), `readView()`, `writeView(view)`, `readManualReducedMotion()`, `writeManualReducedMotion(value)`, and `resolveReducedMotion(systemReduces: boolean, manual: boolean): boolean` (returns `systemReduces || manual`).
    - Every storage access is wrapped in `try/catch`; on any failure reads return defaults (`'mortal'`, `false`) and writes are silently skipped. Use only the two keys from the Overview. Nothing is written on load, only when the user changes a setting.
    - _Requirements: 8.4, 8.5, 8.6, 8.10, 8.12, 16.4, 16.5_

  - [ ]* 3.6 Write `src/preferences.test.ts` unit tests
    - Missing, unrecognised and valid stored view values; `localStorage` that throws on get and on set (use `vi.spyOn(Storage.prototype, ...)`); writes use only the two allowed keys.
    - _Requirements: 8.4, 8.5, 8.6, 16.4, 16.5_

  - [ ]* 3.7 Write PBT for view parsing in `src/preferences.test.ts`
    - **Property 3: Only the exact string "haunted" parses to the Haunted view**
    - For any arbitrary string `s` (generator: `fc.oneof(fc.string(), fc.constantFrom('haunted', 'mortal', 'Haunted', ' haunted', ''))`), `parseView(s)` returns `'haunted'` if and only if `s === 'haunted'`, and `'mortal'` otherwise. For any non-string value (`fc.anything()` filtered to non-strings), `parseView` returns `'mortal'`. `parseView(view) === view` for both valid views. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 8.4, 8.6**

  - [ ]* 3.8 Write PBT for reduced-motion resolution in `src/preferences.test.ts`
    - **Property 6: Reduced motion is on whenever the system requests it**
    - For any pair of booleans `(systemReduces, manual)`, `resolveReducedMotion` returns `true` whenever `systemReduces` is `true` (the manual setting cannot re-enable motion), and returns `manual` whenever `systemReduces` is `false`. Comment above in one sentence; `numRuns: 100`.
    - **Validates: Requirements 4.7, 4.8, 8.11, 8.12**

  - [ ]* 3.9 Write PBT for identical-colour contrast in `src/styles/contrast.test.ts`
    - **Property 2: Contrast of identical colours is 1**
    - For any colour `c` (same generator as Property 1), `contrastRatio(c, c)` equals 1. This is separate from Property 1, which a function returning 2 for equal colours would still satisfy. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 4.3, 9.8**

  - [ ]* 3.10 Write PBT for the preference round trip in `src/preferences.test.ts`
    - **Property 4: Preference write/read round trip uses only the allowed keys**
    - For any view `v` and boolean `m`, after clearing `localStorage` and calling `writeView(v)` and `writeManualReducedMotion(m)`: `readView()` returns `v`, `readManualReducedMotion()` returns `m`, and the keys present in `localStorage` are a subset of `{'phantom-inbox:view', 'phantom-inbox:reduced-motion'}`, with values only `'mortal' | 'haunted'` and `'true' | 'false'`. Clear storage inside each iteration. Comment above in one sentence; `numRuns: 100`.
    - **Validates: Requirements 8.5, 8.10, 16.4, 4.8**

  - [ ]* 3.11 Write PBT for storage failure fallback in `src/preferences.test.ts`
    - **Property 5: Storage failures fall back to defaults without errors**
    - For any failure mode from `fc.constantFrom('getThrows', 'setThrows', 'accessThrows')` and any view `v` and boolean `m`: `readView()` returns `'mortal'`, `readManualReducedMotion()` returns `false`, `writeView(v)` and `writeManualReducedMotion(m)` do not throw, and no `console` method is called (spy on `log`, `info`, `warn`, `error`, `debug`). Implement the modes with `vi.spyOn(Storage.prototype, 'getItem' | 'setItem')` and `Object.defineProperty(window, 'localStorage', { get() { throw ... }, configurable: true })`; restore all mocks and the original property after every iteration. Comment above in one sentence; `numRuns: 100`.
    - **Validates: Requirements 8.6, 16.5**

- [ ] 4. Placeholder app shell
  - [ ] 4.1 Create `src/components/ViewToggle.tsx`
    - A single `<button type="button" role="switch">` with `aria-checked` true when Haunted is active and a constant accessible name "Haunted view". Props: `view`, `onChange`. Native button behaviour gives Tab focus plus Enter and Space activation. Show the current view name as visible text too.
    - _Requirements: 8.2, 8.7, 8.8, 8.9_

  - [ ] 4.2 Create `src/components/ReducedMotionToggle.tsx` and `src/useSystemReducedMotion.ts`
    - `useSystemReducedMotion()` reads `window.matchMedia('(prefers-reduced-motion: reduce)')`, subscribes to changes, and returns `false` when `matchMedia` is unavailable (jsdom has none).
    - `ReducedMotionToggle`: a `role="switch"` button named "Reduce motion" with `aria-checked`; when the system requests reduced motion it is shown as on and disabled-looking via text ("Your device already requests reduced motion") but stays focusable (use `aria-disabled`, not `disabled`).
    - _Requirements: 8.10, 8.12, 4.7, 4.8_

  - [ ] 4.3 Create `src/styles/app.css`
    - Layout using only tokens (`var(--color-*)`, `var(--space-*)`, `var(--font-*)`); root `.app` fills the viewport with `--color-bg` and `--color-text`; buttons have `--color-border` borders, at least 44px target height, and a `:focus-visible` outline of `var(--focus-width)` solid `var(--color-focus)` with a 2px offset.
    - Reduced motion: `.app[data-reduced-motion='true'] *` and a `@media (prefers-reduced-motion: reduce)` block both set `animation: none !important; transition: none !important;`. Any transition used in normal mode must be at most 100 ms.
    - _Requirements: 8.3, 8.9, 8.11, 8.13, 4.5, 4.7_

  - [ ] 4.4 Create `src/App.tsx`, `src/main.tsx` and `index.html`
    - `App`: root `<div className="app" data-view={view} data-reduced-motion={String(reduced)}>` containing `<header>` with `<h1>Phantom Inbox</h1>`, the pitch paragraph (verbatim), `<main>` with the two toggles. State initialised from `readView()` and `readManualReducedMotion()`; `reduced = resolveReducedMotion(useSystemReducedMotion(), manual)`; changes call `writeView` / `writeManualReducedMotion`. State updates synchronously so the switch completes well under 100 ms.
    - `main.tsx`: imports `./styles/tokens.css` and `./styles/app.css`, renders `<App />` in `StrictMode`.
    - `index.html`: `<html lang="en">`, a title, viewport meta, `<div id="root">`, `<script type="module" src="/src/main.tsx">`. Do not put the CSP in this file (the build plugin injects it).
    - No imports from `src/detection/` and no network APIs.
    - _Requirements: 8.1 to 8.6, 8.10, 8.12, 8.14, 7.5, 7.12, 7.10_

  - [ ] 4.5 Write `src/App.test.tsx` (required)
    - Axe test: render `<App />` in Mortal view and, in a second render, in Haunted view (switch via the toggle or seed `localStorage`), run `axe.run(container, { rules: { 'color-contrast': { enabled: false } } })` and assert `violations` has length 0 in each. Colour contrast is covered by task 3.4 because jsdom cannot compute it.
    - Toggle test: with `userEvent`, assert the shell starts in Mortal (`data-view="mortal"`), clicking the "Haunted view" switch gives `haunted`, clicking again gives `mortal`; `aria-checked` follows.
    - _Requirements: 9.3, 9.4, 8.2, 8.3, 8.8_

  - [ ]* 4.6 Write `src/App.preferences.test.tsx`
    - Persists the view and the reduced-motion setting across a re-render; falls back to Mortal when storage throws and shows no error; Enter and Space both activate the view toggle; with a mocked `matchMedia` that matches `prefers-reduced-motion: reduce`, `data-reduced-motion` stays `"true"` even when the manual setting is off; the pitch and product name appear in both views.
    - _Requirements: 8.1, 8.4, 8.5, 8.6, 8.7, 8.10, 8.12, 16.5_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Run, one per call: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. All must exit 0. Fix failures at the cause (never by skipping or deleting tests). Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Agent hooks
  - Create these after all `src/` work is done so the hooks do not fire during scaffolding. Write each file with the file-writing tool at `d:\projects\kiroween\.kiro\hooks\<id>.json`, in the schema `{"version":"v1","hooks":[{"name","trigger","matcher"?,"action":{"type","command"|"prompt"}}]}`. In JSON, escape every `\` of the Overview matchers as `\\`.
  - If a hook file cannot be created, list for the user its exact name, trigger, matcher, action type and command or prompt, and report it as not created (Requirement 10.9).

  - [ ] 6.1 Create `run-tests.json`
    - One entry: name `run-tests`, trigger `PostFileSave`, the run-tests matcher, action `{"type":"command","command":"npx vitest --run"}`.
    - _Requirements: 10.1, 10.2, 10.7_

  - [ ] 6.2 Create `rule-tests.json`
    - Two entries (one per trigger) named `rule-tests-create` (`PostFileCreate`) and `rule-tests-save` (`PostFileSave`), same rule-tests matcher, action type `agent` with the same prompt: create or update the matching `<rule>.test.ts` in the same directory; include a fast-check property-based test (at least 100 runs, one-sentence property comment) where the rule's behaviour can be expressed as a property over generated input; do not edit any file other than that test file.
    - _Requirements: 10.1, 10.3, 10.6, 10.7, 10.8_

  - [ ] 6.3 Create `a11y-check.json`
    - Two entries named `a11y-check-create` (`PostFileCreate`) and `a11y-check-save` (`PostFileSave`), same a11y-check matcher, action type `agent` with the same prompt: check the saved file for accessibility and colour contrast against `.kiro/steering/design-system.md` and report each violation with the file name and the rule violated; do not edit files outside the saved component's own scope (the file itself and its test).
    - _Requirements: 10.1, 10.4, 10.6, 10.7, 10.8_

  - [ ] 6.4 Create `journal.json`
    - One entry: name `journal`, trigger `PostTaskExec`, no `matcher` key, action type `agent`, prompt: append exactly one line to `docs/kiro-journal.md` in the form `- YYYY-MM-DD | <Kiro feature> | <description>`, with today's date, a description of at most 2 sentences naming the Kiro feature used and how it was used, and no `|` character inside the feature name or description.
    - _Requirements: 10.1, 10.5, 11.4_

- [ ] 7. Journal
  - [ ] 7.1 Create `docs/kiro-journal.md`
    - Get the date with `Get-Date -Format yyyy-MM-dd`.
    - Content: a single level-1 heading; a purpose paragraph of 1 to 3 sentences and at most 60 words saying the file logs how Kiro features were used to build the project; then three seed entry lines, one each for `Specs`, `Steering` and `Hooks`, each of the form `- YYYY-MM-DD | <Kiro feature> | <1 to 2 sentences>`.
    - The journal hook appends entries at the end of each task execution. If the file already exists because the hook fired, keep its valid entry lines and add the heading, purpose paragraph and seed entries around them. Every line starting with `- ` must match the entry format.
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 8. README
  - [ ] 8.1 Create `README.md`
    - Pitch verbatim; description of Possession Check, Exorcism and Séance (1 to 3 sentences each, each marked "planned"); privacy promise (all processing runs in the browser, no message is stored or sent anywhere); statement that results are never 100% certain and never a guarantee that a message is safe or a scam.
    - Commands, one each: `npm install`, `npm run dev`, `npm test` (runs `vitest --run` once), `npm run build`.
    - License: "MIT" with a Markdown link `[LICENSE](LICENSE)`. Every referenced command, file and link target must exist.
    - _Requirements: 12.1 to 12.8_

- [ ] 9. Repo-conformance tests (`tests/repo-conformance.test.ts`, one file, built up in steps)
  - Use `node:fs` and `node:path` relative to the project root. Give each check its own named `it` (or `it.each` row) whose name or assertion message includes the file and the missing section or rule, so a failure names what is wrong. Check structure and key phrases only.

  - [ ] 9.1 Create the file with steering format and `product.md` checks
    - Exactly five files in `.kiro/steering/` with the required names; each has `---` on line 1, `inclusion: always` in the front matter, and at most 200 lines; `product.md` is non-empty, at most 10,000 characters, and contains the pitch, three user groups, six scam categories, three features, both view names, the spooky-design rationale, a "Non-goals" heading with its five items, and the "100%" certainty/risk-level statement.
    - _Requirements: 1.9, 6.5, 1.1 to 1.8_

  - [ ] 9.2 Add `tech.md` and `structure.md` checks
    - `tech.md`: each of the nine stack names appears; the five script names match `package.json` keys exactly and each script's command matches the command quoted in `tech.md`; the doc mentions `vitest --run`, exact version pinning, zero network calls, and the three hosting options; report the mismatched item by name.
    - `structure.md`: first heading is level 1; all nine paths listed; test placement rule, naming conventions and `<rule>.test.ts` rule present; each documented regex equals the `matcher` of the corresponding hook file (report the hook name on mismatch).
    - `tech.md` or `structure.md` lists all four hook names with their triggers.
    - _Requirements: 2.8, 3.7, 10.10_

  - [ ] 9.3 Add `design-system.md` and `security-privacy.md` checks
    - `design-system.md`: both views have the required token names; 4.5:1 and 3:1 thresholds, 18px and 16px minimums, 2px focus, 40-character label limit, reduced-motion rules and persistence statement all present.
    - `security-privacy.md`: key statements from Requirement 5 present (no backend, storage list, no analytics, plain-text rendering, no 100% certainty, dev-server exemption); the CSP code block text equals `CSP` imported from `../csp`; the CSP contains `connect-src 'none'` and `script-src 'self'` and no `unsafe-inline` or `unsafe-eval`.
    - _Requirements: 5.9, 4.1 to 4.9, 5.2 to 5.8, 7.9_

  - [ ] 9.4 Add hook checks
    - Each of the four hook files parses as JSON, has `version` `"v1"`, a non-empty `name` per entry, a trigger from the supported list, and a valid action; `rule-tests` and `a11y-check` have one entry per trigger; `journal` has no matcher.
    - Matcher behaviour with `new RegExp(matcher)`: run-tests matches `src/App.tsx`, `src\components\X.tsx` and `d:\projects\kiroween\src\a.ts`, and does not match `tests/x.ts`; rule-tests matches `src/detection/rules/kyc.ts` and `src\detection\rules\kyc.ts` but not `kyc.test.ts` or `kyc.test.tsx` or files outside `rules`; a11y-check matches `.tsx` and `.css` under `src` with both separators but not `*.test.ts` or `*.test.tsx`.
    - Prompts of rule-tests and a11y-check each contain an instruction not to edit files outside scope.
    - _Requirements: 10.1 to 10.8_

  - [ ] 9.5 Add journal, license, README, repository and source-scan checks
    - Journal helpers: define `ENTRY_PATTERN = /^- (\d{4}-\d{2}-\d{2}) \| ([^|]+?) \| ([^|]+)$/`, `isValidEntryLine(line)`, `parseEntryLine(line)` (returns `{ date, feature, description }` or `null`) and `formatEntryLine(entry)` inside `tests/repo-conformance.test.ts` itself (not in a separate file, because `tests/` holds only the conformance tests). Task 9.9 uses them.
    - Journal: exactly one level-1 heading as the first non-empty line; purpose paragraph 1 to 3 sentences and at most 60 words; every line starting with `- ` passes `isValidEntryLine` with at most 2 sentences in the description (report the invalid line); entries for Specs, Steering and Hooks exist.
    - `LICENSE`: non-empty, contains the exact copyright line immediately before the "Permission is hereby granted" paragraph. `package.json`: `license` is `"MIT"`; every dependency and devDependency version matches `^\d+\.\d+\.\d+` with no range operators; `tsconfig.json` has `strict: true`; `vite.config.ts` contains `base: './'`.
    - README: pitch present, three features each marked planned, privacy promise, certainty statement, the four commands match `package.json` scripts, MIT statement, and every relative Markdown link target exists.
    - `.gitignore`: lists `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*`; no non-comment line contains `.kiro`.
    - Source scan over non-test files under `src/`: no `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `sendBeacon`; App shell files (`src/App.tsx`, `src/main.tsx`, `src/components/*.tsx`, `src/preferences.ts`) have no import path containing `detection`.
    - _Requirements: 11.5, 13.4, 13.5, 12.8, 14.1, 14.2, 7.7, 7.10, 8.14, 7.12_

  - [ ]* 9.6 Write PBT for the run-tests matcher in `tests/repo-conformance.test.ts`
    - **Property 7: The run-tests matcher accepts every TypeScript file under an src segment**
    - Load the matcher from `.kiro/hooks/run-tests.json` and build `new RegExp(matcher)`. Shared generators (define once in the file, reuse in 9.7 and 9.8): directory segments from `fc.stringMatching(/^[A-Za-z0-9_-]{1,8}$/)` filtered to exclude exactly `src`; separators per position from `fc.constantFrom('/', '\\')`; optional `d:\\` prefix.
    - Property: a path `<prefix><dirs...>src<sep><more dirs...><name><ext>` matches when `ext` is `.ts` or `.tsx`; it does not match when the path has no segment equal to `src` (including a segment such as `mysrc`), or when `ext` comes from a fixed list such as `.js`, `.css`, `.json`, `.md`. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 10.2, 10.7**

  - [ ]* 9.7 Write PBT for the rule-tests matcher in `tests/repo-conformance.test.ts`
    - **Property 8: The rule-tests matcher accepts rule files and never test files**
    - Load the matcher from `.kiro/hooks/rule-tests.json`. Rule names from `fc.stringMatching(/^[a-z0-9-]{1,12}$/)`, prefixes and mixed `/` and `\` separators from the shared generators.
    - Property: `<prefix>src<sep>detection<sep>rules<sep><name>.ts` matches; `<name>.test.ts` and `<name>.test.tsx` in that folder do not match; `<name>.ts` in any other folder (a sibling of `rules`, or a sub-folder of `rules`) does not match. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 10.3, 10.6, 10.7**

  - [ ]* 9.8 Write PBT for the a11y-check matcher in `tests/repo-conformance.test.ts`
    - **Property 9: The a11y-check matcher accepts UI files and never test files**
    - Load the matcher from `.kiro/hooks/a11y-check.json`. Base names without dots from `fc.stringMatching(/^[A-Za-z0-9_-]{1,12}$/)`, any sub-path under `src` of zero to three segments, prefixes and mixed separators from the shared generators.
    - Property: `<prefix>src<sep><sub-path><base>.tsx` and `<base>.css` match; any path ending in `.test.ts` or `.test.tsx` does not match. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 10.4, 10.6, 10.7**

  - [ ]* 9.9 Write PBT for journal entry lines in `tests/repo-conformance.test.ts`
    - **Property 10: Journal entry lines round-trip and malformed lines are rejected**
    - Use the `isValidEntryLine`, `parseEntryLine` and `formatEntryLine` helpers defined inside this file in task 9.5. Generators: dates from integer year, month (1 to 12) and day (1 to 28) with zero padding; feature and description strings with no `|`, no newline and no leading or trailing whitespace; descriptions built from one or two sentences.
    - Property (round trip): `formatEntryLine(entry)` passes `isValidEntryLine`, and `parseEntryLine` of that line returns the same date, feature and description.
    - Property (rejection): the same line altered by adding an extra `| <field>`, removing a field, or replacing the date with a non-`YYYY-MM-DD` form (for example `YYYY/MM/DD` or a two-digit year) fails `isValidEntryLine`. Write the round trip and the rejection as two `fc.assert` calls in one test. Comment above in one sentence; `numRuns: 200`.
    - **Validates: Requirements 11.4, 11.5, 10.5**

- [ ] 10. Final checkpoint - Ensure all tests pass, then create the single commit
  - Ensure all tests pass, ask the user if questions arise.

  - [ ] 10.1 Run all checks
    - Run, one per call: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. If any exits non-zero, stop, create no commit, leave all files uncommitted and report the failing check (Requirement 15.2).
    - Verify the build: `Test-Path dist\index.html` is true; `Select-String -Path dist\index.html -Pattern 'Content-Security-Policy'` finds the meta tag and its content equals `CSP` from `csp.ts`; `Select-String -Path dist\index.html -Pattern '(src|href)="https?://'` finds nothing.
    - Confirm `npm test` output shows 0 failed, 0 skipped and 0 todo tests.
    - _Requirements: 7.2 to 7.6, 7.9, 9.5, 15.1, 15.2, 16.2, 16.3_

  - [ ] 10.2 Initialise git if needed, create exactly one commit, and report
    - Append one more journal line for this step (with the same format) before staging.
    - `if (-not (Test-Path .git)) { git init }`, then `git rev-parse --is-inside-work-tree` must print `true`. If a repository with existing commits is found, do not run `git init`, do not rewrite history, and ask the user how to proceed. Never change git config; if the commit fails because no author identity is set, report that and do not retry more than once.
    - Verify ignores: `git check-ignore .kiro/steering/product.md` prints nothing with exit code 1; `git check-ignore node_modules/x dist/x coverage/x .env` prints all four paths with exit code 0.
    - Stage by name: `git add .kiro/steering .kiro/hooks .kiro/specs/phantom-inbox-foundation src tests docs package.json package-lock.json .npmrc index.html tsconfig.json vite.config.ts csp.ts eslint.config.js README.md LICENSE .gitignore`.
    - Commit with separate `-m` arguments (PowerShell-safe): subject `Add Phantom Inbox foundation scaffold` (imperative verb, at most 72 characters), then a body paragraph that mentions the Steering_Docs, the Scaffold, the Hooks and the LICENSE.
    - Verify: `git rev-list --count HEAD` prints `1`; `git status --porcelain` prints nothing; `git ls-files` lists no path starting with `node_modules/` or `dist/`.
    - The journal hook fires after this task completes and may append one more line, leaving the tree dirty. If so, do not amend or add a second commit; tell the user.
    - Final report to the user: files and folders created; each key decision with at least one reason (stack, hook design, CSP, view tokens); hook settings the user must add manually (or "none").
    - _Requirements: 14.3 to 14.6, 15.1, 15.3 to 15.8, 16.6_

## Notes

- Property coverage (design.md Correctness Properties): 1 = task 3.2 (non-optional, mandated by Requirements 9.2 and 9.9), 2 = 3.9, 3 = 3.7, 4 = 3.10, 5 = 3.11, 6 = 3.8, 7 = 9.6, 8 = 9.7, 9 = 9.8, 10 = 9.9. All except Property 1 are optional.
- Tasks marked with `*` are optional and can be skipped for a faster MVP. Tests that Requirements 9 and the conformance requirements mandate are not optional.
- The journal hook (PostTaskExec) appends lines while tasks run, and the last firing happens after the commit. Seed entries and appended entries must all match the line format.
- Contrast is verified by the token-pair test (3.4), not by axe, because jsdom cannot compute rendered colours.
- `public/_headers` is intentionally not created; the meta tag is the only CSP mechanism.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.4"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.3"] },
    { "id": 2, "tasks": ["3.1", "3.5", "4.3"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6", "4.1", "4.2"] },
    { "id": 4, "tasks": ["3.7", "3.9", "4.4"] },
    { "id": 5, "tasks": ["3.8", "4.5", "4.6"] },
    { "id": 6, "tasks": ["3.10"] },
    { "id": 7, "tasks": ["3.11"] },
    { "id": 8, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 9, "tasks": ["7.1", "8.1", "9.1"] },
    { "id": 10, "tasks": ["9.2"] },
    { "id": 11, "tasks": ["9.3"] },
    { "id": 12, "tasks": ["9.4"] },
    { "id": 13, "tasks": ["9.5"] },
    { "id": 14, "tasks": ["9.6"] },
    { "id": 15, "tasks": ["9.7"] },
    { "id": 16, "tasks": ["9.8"] },
    { "id": 17, "tasks": ["9.9"] },
    { "id": 18, "tasks": ["10.1"] },
    { "id": 19, "tasks": ["10.2"] }
  ]
}
```
