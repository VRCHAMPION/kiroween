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

## Scripts

- `dev` (`vite`): starts the development server.
- `build` (`vite build`): writes the static site to `dist/`.
- `typecheck` (`tsc --noEmit`): checks types without writing files.
- `lint` (`eslint . --max-warnings 0`): fails on any error or warning.
- `test` (`vitest --run`): runs every test once and exits. It never starts watch mode.

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
- `journal` (PostTaskExec), matcher: none