---
inclusion: always
---

# Technology

## Stack

- React: builds the user interface.
- Vite: dev server and production build to static files.
- TypeScript (strict mode): all source code is typed, with `strict` on.
- Vitest: runs the tests once, without watch mode.
- fast-check: property-based testing, which checks rules against many generated inputs.
- jsdom: a simulated browser used by tests.
- Testing Library: renders components and simulates user actions in tests.
- axe-core: automatic accessibility checks in tests.
- ESLint: static checks for code problems.
- @fontsource/creepster: bundles the Creepster heading font (SIL Open Font License 1.1) so no font loads from another origin.
- puppeteer-core: drives an installed Chrome or Edge for the mobile performance check, `node scripts/perf-mobile.mjs`.
- tldts: reads the Public Suffix List (MIT code, MPL-2.0 data) so the engine always judges the registrable domain. It sits in the lazy `detection-data` chunk, never in the first-paint files.
- tsx: runs the TypeScript evaluation script `scripts/eval/run.ts` in Node. Development only; not shipped.
- tesseract.js: reads screenshots in the browser. It is loaded only when a screenshot is added, from this site's `ocr/` folder, with `workerBlobURL: false` and `cacheMethod: 'none'`.

## Scripts

- `dev` (`vite`): starts the development server.
- `build` (`vite build`): writes the static site to `dist/`.
- `typecheck` (`tsc --noEmit`): checks types without writing files.
- `lint` (`eslint . --max-warnings 0`): fails on any error or warning.
- `test` (`vitest --run`): runs every test once and exits. It never starts watch mode.
- `preview` (`vite preview`): serves the production build in `dist/` on 127.0.0.1:4173 with the same headers as `vercel.json`.
- `eval` (`tsx scripts/eval/run.ts`): measures precision, recall and false-positive rate on a local folder of messages. Development only.
- `gen:confusables` (`node --use-system-ca scripts/gen-confusables.mjs`): regenerates `src/detection/data/confusables.ts` from Unicode `confusables.txt`.
- `gen:brands` (`node --use-system-ca scripts/gen-brands.mjs`): regenerates `src/detection/data/top-brands.ts` from the Majestic Million list.

The `scripts/gen-*.mjs` files use `fetch` at development time only. Nothing under `src/` does.

## Rules

- Runtime code makes zero network calls.
- The target is free static hosting: GitHub Pages, Netlify or Cloudflare Pages. The Vite `base` is `./` so the site works from a sub-path.
- Every dependency version in `package.json` is pinned to an exact version, with no `^`, `~` or range prefixes. `.npmrc` sets `save-exact=true`.
- Every npm script runs unchanged in Windows PowerShell. Do not use POSIX-only syntax such as `&&` chaining, `export VAR=value`, `rm -rf` or single-quoted shell globs.
- Property-based tests use at least 100 runs and a one-sentence comment above them that states the property.

## Hooks

Hooks are Kiro automations stored in `.kiro/hooks/`. A matcher is a JavaScript regular expression tested against the file path.

- `run-tests` (PostFileSave), matcher: `(^|[/\\])src[/\\].*\.tsx?$`
- `rule-tests` (PostFileCreate, PostFileSave), matcher: `(^|[/\\])src[/\\]detection[/\\]rules[/\\](?![^/\\]*\.test\.ts$)[^/\\]+\.ts$`
- `a11y-check` (PostFileCreate, PostFileSave), matcher: `(^|[/\\])src[/\\](?!.*\.test\.tsx?$).*\.(tsx|css)$`
- `detection-tests` (PostFileSave), matcher: `(^|[/\\])src[/\\]detection[/\\].*\.tsx?$`
- `journal` (PostTaskExec), matcher: none