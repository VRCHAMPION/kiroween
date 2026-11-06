# Kiro journal

This file logs how Kiro features were used to build Phantom Inbox. Each line records the date, the Kiro feature and how it was used.

- 2026-11-07 | Specs | Wrote a requirements-first spec for the foundation step with EARS acceptance criteria, a design with ten correctness properties, and a task list. Each requirement was refined by a separate requirement-detailer agent before the design.
- 2026-11-07 | Steering | Added five always-included steering files for product, tech, structure, design system and security and privacy. They pin the token values, the Content-Security-Policy and the hook matchers that the code and tests copy.
- 2026-11-07 | Hooks | Added four hooks that run tests on save, write tests for new detection rules, check UI files for accessibility and contrast, and append a journal line after each task. Their regex matchers accept both slash styles and skip test files to avoid loops.
- 2026-11-07 | Agent | Built the scaffold, tests and hooks from the task list and gated the commit on typecheck, lint, 242 passing tests and a clean build. Fixed a TLS certificate error in npm by using the Windows certificate store.
- 2026-11-07 | Specs | Wrote the detection-engine spec and built a pure TypeScript engine with 17 rule files, 15 made-up sample messages and fast-check properties for score range, monotonicity, idempotent normalisation and empty input. All 383 tests pass, with every scam scoring 72 to 95 and every genuine message scoring 0.
- 2026-11-07 | Specs | Wrote the possession-check-ui spec and built the main screen with a message box, .eml file picker, sample menu, shape-coded verdict, numbered red flag cards and exact-word highlights. Component and axe tests caught a rule matching inside a URL, which was fixed in the engine with a regression test.
