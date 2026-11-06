---
inclusion: always
---

# Project structure

## Folders

- `src/`: all application and engine source code.
- `src/components/`: React components.
- `src/detection/`: the scam detection engine, which has no UI code.
- `src/detection/rules/`: one file per detection rule.
- `src/styles/`: CSS and style helpers such as design tokens and the contrast function.
- `src/features/`: one folder per screen, such as `possession-check/`; feature code may import the detection engine.
- `src/email/`: the `.eml` file parser, which works on strings only.
- `src/data/`: sample messages used by the screens and tests.
- `docs/`: project documents, including `docs/kiro-journal.md`.
- `.kiro/steering/`: guidance files that Kiro reads in every session.
- `.kiro/hooks/`: Kiro automations, one JSON file per hook group.
- `.kiro/specs/`: requirements, design and task lists for each feature.

## Tests

- Tests for code under `src/` sit next to the code they test.
- Shell files (`src/App.tsx`, `src/components/`) never import `src/detection/` directly; they mount features instead.
- The top-level `tests/` folder holds only the repo conformance tests, `tests/repo-conformance.test.ts`.

## Detection rules

- Detection rule files live in `src/detection/rules/`.
- Each rule file has exactly one test file named `<rule>.test.ts` in the same folder.

## Naming

- Components: `PascalCase.tsx`, for example `ViewToggle.tsx`.
- Detection rule files: `kebab-case.ts`, for example `kyc-expiry.ts`.
- Test files: `<name>.test.ts` or `<name>.test.tsx`, for example `kyc-expiry.test.ts`.
- Style files: `kebab-case.css`, for example `tokens.css`.

## Hook matchers

These are the exact matchers in `.kiro/hooks/`. They accept `/` and `\` and skip test files where noted.

- `run-tests` (PostFileSave), matcher: `(^|[/\\])src[/\\].*\.tsx?$`
- `rule-tests` (PostFileCreate, PostFileSave), matcher: `(^|[/\\])src[/\\]detection[/\\]rules[/\\](?![^/\\]*\.test\.ts$)[^/\\]+\.ts$`
- `a11y-check` (PostFileCreate, PostFileSave), matcher: `(^|[/\\])src[/\\](?!.*\.test\.tsx?$).*\.(tsx|css)$`