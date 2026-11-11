# Requirements Document

## Introduction

Phantom Inbox is a browser-only scam detector for emails, SMS and WhatsApp messages, focused on scams common in India (KYC expiry, courier/customs fees, electricity bill disconnection, UPI refunds and collect requests, fake job/task offers, "digital arrest"). It serves non-technical adults, elderly parents, and people learning to spot scams. Pitch: "Every scam has a ghost hiding in it. Phantom Inbox makes it visible."

The product will have three features: Possession Check (analyse a message), Exorcism (next steps and a family warning), and Séance (real-or-scam training game). It has two views: a calm, high-contrast Mortal view and a dark Haunted view where each red flag is a ghost on the exact words it explains.

This spec covers the FOUNDATION STEP only: steering documents, a runnable and tested project scaffold, agent hooks, README, LICENSE, .gitignore, journal seed, and the initial git commit. The detection engine, Possession Check, Exorcism and Séance are out of scope and are only described as context inside the steering documents.

## Glossary

- **Project**: The Phantom Inbox repository, rooted at the repository root.
- **Steering_Docs**: The five Markdown files in `.kiro/steering/`: `product.md`, `tech.md`, `structure.md`, `design-system.md`, `security-privacy.md`.
- **Scaffold**: The runnable React + Vite + TypeScript application, its configuration, and its sample tests.
- **App_Shell**: The placeholder UI that shows the product name and the view toggle.
- **Mortal_View**: The calm, high-contrast, large-text view intended for elders.
- **Haunted_View**: The dark haunted-mansion view in which each red flag is shown as a ghost on the words it concerns.
- **View_Toggle**: The control that switches between Mortal_View and Haunted_View.
- **Reduced_Motion_Mode**: The state in which all non-essential animation is replaced by static presentation. It is active WHEN the `prefers-reduced-motion: reduce` media query matches OR the manual reduced-motion setting is on. The manual setting can only add reduction; it cannot re-enable motion while the system requests reduced motion.
- **Detection_Rule_File**: A source file defining a scam detection rule, located under `src/detection/rules/`, excluding test files.
- **UI_File**: A `.tsx` or `.css` file under `src/` (excluding test files).
- **Hook**: A Kiro agent hook JSON file at `.kiro/hooks/<id>.json` with schema `{"version":"v1","hooks":[{"name","trigger","matcher"?,"action":{"type","command"|"prompt"}}]}`. A Hook matcher is a JavaScript-compatible regular expression, not a glob.
- **Journal**: The file `docs/kiro-journal.md`, a log of how Kiro features were used.
- **Test_Suite**: All tests run by `vitest --run`, including the Repo_Conformance_Tests.
- **Repo_Conformance_Tests**: A single test file, `tests/repo-conformance.test.ts`, that is part of the Test_Suite and checks repository documents and configuration (presence, front matter, line counts, required headings and key phrases, matcher consistency, journal format, license). It checks structure and key phrases, not semantic meaning.
- **PBT**: Property-based test written with fast-check.
- **Repository**: The git repository created in the Project root.
- **User**: The developer who owns the Project.

## Requirements

### Requirement 1: Product steering document

**User Story:** As a developer, I want a product steering document, so that Kiro always has the product vision and boundaries in context.

#### Acceptance Criteria

1. THE Project SHALL contain a file named `product.md` in `.kiro/steering/`, with a non-empty body of at least 1 line of Markdown text and a size of no more than 10,000 characters.
2. THE product.md file SHALL contain a section stating the pitch "Every scam has a ghost hiding in it. Phantom Inbox makes it visible." verbatim.
3. THE product.md file SHALL contain a section naming all three target user groups: non-technical adults, elderly parents, and scam-awareness learners.
4. THE product.md file SHALL contain a section naming all six scam categories from the Introduction: KYC expiry, courier/customs fees, electricity bill disconnection, UPI refunds and collect requests, fake job/task offers, and "digital arrest".
5. THE product.md file SHALL describe exactly three features, named Possession Check, Exorcism and Séance, each with a purpose statement of exactly one sentence and no more than 200 characters.
6. THE product.md file SHALL describe Mortal_View and Haunted_View, each with a description of 1 to 3 sentences, and SHALL state that the spooky design exists to make the reasons behind each red flag easier to understand.
7. THE product.md file SHALL contain a section headed "Non-goals" that lists each of the following as a separate item: backend services, paid APIs, user accounts, message storage, and tracking.
8. THE product.md file SHALL state that Phantom Inbox does not claim 100% certainty and that each result is expressed as a risk level accompanied by at least 1 reason.
9. IF `.kiro/steering/product.md` is missing, empty, or lacks any heading or key phrase required by criteria 2 to 8, THEN THE Repo_Conformance_Tests SHALL report a failing test that names the missing file or section.

### Requirement 2: Technology steering document

**User Story:** As a developer, I want a technology steering document, so that Kiro uses the agreed stack and commands.

#### Acceptance Criteria

1. THE Project SHALL contain a file `.kiro/steering/tech.md` that is non-empty and is valid UTF-8 Markdown.
2. THE tech.md file SHALL name each of React, Vite, TypeScript (strict mode), Vitest, fast-check, jsdom, Testing Library, axe-core and ESLint exactly once as an entry in a stack list, with a one-line statement of its role.
3. THE tech.md file SHALL list the npm script names `dev`, `build`, `typecheck`, `lint` and `test`, each with a one-sentence description of what the script does.
4. THE tech.md file SHALL state that the `test` script runs `vitest --run` in single-execution mode and does not start watch mode.
5. THE tech.md file SHALL state that runtime code makes zero network calls, and that the deployment target is free static hosting on one of GitHub Pages, Netlify or Cloudflare Pages.
6. THE tech.md file SHALL state that every dependency version in `package.json` is pinned to an exact version, with no `^`, `~` or range prefixes.
7. THE tech.md file SHALL state that every npm script runs unchanged in Windows PowerShell and uses no POSIX-only syntax, such as `&&` chaining, `export VAR=value`, `rm -rf`, or single-quoted shell globs.
8. IF the tech.md file names a script, tool or constraint that does not match `package.json` or the Scaffold configuration, THEN THE Repo_Conformance_Tests SHALL fail and report the name of the mismatched item.

### Requirement 3: Structure steering document

**User Story:** As a developer, I want a structure steering document, so that files go in predictable places and hooks can match them.

#### Acceptance Criteria

1. THE Project SHALL contain a file at `.kiro/steering/structure.md` that is non-empty and is valid Markdown beginning with a level-1 heading (after front matter).
2. THE structure.md file SHALL document the folder layout by listing each of the following paths, each with a one-sentence purpose statement: `src/`, `src/components/`, `src/detection/`, `src/detection/rules/`, `src/styles/`, `docs/`, `.kiro/steering/`, `.kiro/hooks/` and `.kiro/specs/`.
3. THE structure.md file SHALL state one test placement rule: tests for code under `src/` are co-located with the code they test, and the top-level `tests/` folder holds only the Repo_Conformance_Tests.
4. THE structure.md file SHALL state that Detection_Rule_Files live in `src/detection/rules/` and that each Detection_Rule_File has exactly one test file named `<rule>.test.ts` in the same folder.
5. THE structure.md file SHALL state one naming convention for each of the following file kinds, with at least one example filename per kind: components, Detection_Rule_Files, test files and style files.
6. THE structure.md file SHALL document the regex matcher each Hook uses to match Detection_Rule_Files and UI_Files, and each documented regex SHALL be identical to the matcher value in the corresponding Hook file under `.kiro/hooks/`.
7. IF a regex documented in structure.md differs from the matcher value of the corresponding Hook, THEN THE Repo_Conformance_Tests SHALL fail and SHALL report the name of the mismatched Hook.

### Requirement 4: Design system steering document

**User Story:** As a developer, I want a design system steering document, so that both views stay accessible and consistent.

#### Acceptance Criteria

1. THE Project SHALL contain a file at `.kiro/steering/design-system.md` that is non-empty and encoded as UTF-8 Markdown.
2. THE design-system.md file SHALL define, separately for Mortal_View and for Haunted_View, at least 6 named colour tokens (including background, text, and red-flag accent), at least 3 named typography tokens (font family, body size, heading size), and at least 4 named spacing tokens, each with a concrete value.
3. THE design-system.md file SHALL require a contrast ratio of at least 4.5:1 for body text (text smaller than 24px, or smaller than 18.66px when bold) and at least 3:1 for large text (24px or larger, or 18.66px or larger when bold) and for UI component boundaries, in both Mortal_View and Haunted_View, measured per the WCAG 2.1 contrast ratio calculation.
4. THE design-system.md file SHALL set a minimum body text size of 18px for Mortal_View and a minimum body text size of 16px for Haunted_View.
5. THE design-system.md file SHALL require that every interactive element is operable by keyboard alone, and that every interactive element shows a visible focus indicator with a contrast ratio of at least 3:1 against adjacent colours and a thickness of at least 2px.
6. THE design-system.md file SHALL require that colour is never the only means of conveying a red flag, and that each ghost has a visible text label of at least 1 and at most 40 characters naming the red flag type.
7. THE design-system.md file SHALL require a Reduced_Motion_Mode that is active WHEN the `prefers-reduced-motion: reduce` media query matches OR WHEN the user turns on a manual reduced-motion setting, and SHALL require that in this mode all non-essential animation (looping, parallax, flicker, and movement of ghosts) is replaced by static presentation.
8. THE design-system.md file SHALL state that the manual reduced-motion setting can only add reduction and cannot re-enable motion WHILE the system reports `prefers-reduced-motion: reduce`, and that the manual setting persists across page reloads.
9. THE design-system.md file SHALL state that every visual effect in Haunted_View must not reduce the contrast of the flagged words or the ghost's text label below the thresholds in criterion 3, and must leave the red-flag explanation text fully readable and unobscured.

### Requirement 5: Security and privacy steering document

**User Story:** As a user, I want a documented privacy policy for developers, so that my messages are never exposed.

#### Acceptance Criteria

1. THE Project SHALL contain a non-empty file at `.kiro/steering/security-privacy.md`.
2. THE security-privacy.md file SHALL contain a statement that Phantom Inbox has no backend and that no network request carries message content, including in the request URL, headers, or body.
3. THE security-privacy.md file SHALL contain a statement that message content is not written to localStorage, sessionStorage, IndexedDB, cookies, URLs, or console and application logs, and that the only values stored in the browser are the view preference and the reduced-motion preference.
4. THE security-privacy.md file SHALL contain a statement that analytics, tracking, and third-party scripts are not used.
5. THE security-privacy.md file SHALL contain a Content-Security-Policy for static hosting that includes the directives `connect-src 'none'` and `script-src 'self'`, and that allows no `unsafe-inline` or `unsafe-eval` source in `script-src`.
6. THE security-privacy.md file SHALL state that the Content-Security-Policy applies to the production build only and that the Vite development server is exempt, so that `npm run dev` keeps working with hot module replacement.
7. THE security-privacy.md file SHALL contain a statement that no user-facing text claims 100% certainty, and that user-facing results are worded as likelihood or risk level, not as a guarantee.
8. THE security-privacy.md file SHALL contain a statement that untrusted message text is rendered as plain text, and that HTML insertion APIs (for example `innerHTML` and `dangerouslySetInnerHTML`) are not used with message content.
9. IF `security-privacy.md` is missing any heading or key phrase required by criteria 2 to 8, THEN THE Repo_Conformance_Tests SHALL fail and SHALL report which required statement is missing.

### Requirement 6: Steering document format

**User Story:** As a developer, I want steering documents that Kiro loads reliably, so that guidance applies in every session.

#### Acceptance Criteria

1. THE Project SHALL contain exactly five Steering_Docs, named `product.md`, `tech.md`, `structure.md`, `design-system.md` and `security-privacy.md`, each a UTF-8 encoded Markdown file located directly in `.kiro/steering/`.
2. THE Steering_Docs SHALL each begin on line 1 with a YAML front matter block, delimited by `---` lines, that contains the key-value pair `inclusion: always`.
3. THE Steering_Docs SHALL each contain no more than 200 lines, counting the front matter block.
4. THE Steering_Docs SHALL each use headings and short bullet points, and SHALL explain any non-obvious term at its first use.
5. IF a Steering_Doc is missing, has no front matter on line 1, has an `inclusion` value other than `always`, or exceeds 200 lines, THEN THE Repo_Conformance_Tests SHALL fail and SHALL report the file name and the rule that was violated.

### Requirement 7: Runnable project scaffold

**User Story:** As a developer, I want a scaffolded project that installs and runs, so that later features build on a working base.

#### Acceptance Criteria

1. THE Scaffold SHALL use React, Vite and TypeScript with `"strict": true` set in `tsconfig`.
2. WHEN `npm install` is run in the Project root on a machine with network access to the npm registry, THE Scaffold SHALL complete with exit code 0 and install all dependencies declared in `package.json`.
3. WHEN `npm run typecheck` is run, THE Scaffold SHALL complete with exit code 0 and zero reported type errors.
4. WHEN `npm run lint` is run, THE Scaffold SHALL complete with exit code 0 and zero reported errors and zero reported warnings.
5. WHEN `npm run build` is run, THE Scaffold SHALL complete with exit code 0 and write static output to `dist/` that contains an `index.html` file.
6. WHEN `npm test` is run, THE Scaffold SHALL execute `vitest --run` exactly once, exit with code 0 if all tests pass or a non-zero code if any test fails, and terminate without entering watch mode.
7. THE Scaffold SHALL specify every dependency and devDependency version in `package.json` as an exact version (no `^`, `~`, `*`, `latest` or range operators) and SHALL include the npm lockfile in the initial commit.
8. WHEN any npm script defined in `package.json` is run from Windows PowerShell, THE Scaffold SHALL execute it without requiring POSIX-only shell syntax (such as `&&` chaining dependent on `sh`, `export`, or `rm -rf`).
9. THE built `dist/index.html` SHALL contain a `<meta http-equiv="Content-Security-Policy">` tag as the primary CSP mechanism, whose directives are identical to those specified in `security-privacy.md`, and the Scaffold MAY additionally include a `public/_headers` file carrying the same directives.
10. THE Scaffold SHALL contain no runtime code under `src/` (excluding test files) that issues network requests, including calls to `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `navigator.sendBeacon`.
11. IF `npm run typecheck`, `npm run lint`, `npm run build` or `npm test` fails, THEN THE Scaffold SHALL exit with a non-zero code and print the failure details to the terminal, without modifying source files.
12. THE Scaffold SHALL configure the Vite `base` option as a relative path (`./`), so that built assets load from a sub-path such as a GitHub Pages `/<repo>/` URL.

### Requirement 8: Placeholder app shell

**User Story:** As a developer, I want a minimal app shell, so that I can see the project run and verify the two views.

#### Acceptance Criteria

1. WHEN the App_Shell finishes loading, THE App_Shell SHALL display the text "Phantom Inbox" as the product name and the pitch line "Every scam has a ghost hiding in it. Phantom Inbox makes it visible." in both Mortal_View and Haunted_View.
2. THE App_Shell SHALL provide exactly one View_Toggle that switches between Mortal_View and Haunted_View.
3. WHEN the View_Toggle is activated, THE App_Shell SHALL make the other view active and apply that view's design tokens to the whole App_Shell within 100 ms, without a page reload.
4. WHEN the App_Shell loads and no valid persisted view preference exists in localStorage, THE App_Shell SHALL start in Mortal_View.
5. WHEN the user changes the view, THE App_Shell SHALL persist the selected view in localStorage as the only stored data for that preference.
6. IF the persisted view value in localStorage is missing or unrecognised, or localStorage is unavailable or throws an error, THEN THE App_Shell SHALL start in Mortal_View, continue to work without displaying an error, and store no data outside localStorage.
7. THE View_Toggle SHALL be focusable with the Tab key and SHALL be activatable with both the Enter key and the Space key.
8. THE View_Toggle SHALL expose its current state (which view is active) to assistive technology through a programmatically determinable role and state, and SHALL update that state within 100 ms of each view change.
9. THE View_Toggle SHALL show a visible focus indicator with a contrast ratio of at least 3:1 against adjacent colours in both views.
10. THE App_Shell SHALL provide a manual reduced-motion setting that the user can switch on and off and that persists in localStorage across page reloads.
11. WHILE Reduced_Motion_Mode is active, THE App_Shell SHALL disable all non-essential animation and transitions (any animation longer than 0 ms that is not required to convey state).
12. WHILE the user's system reports `prefers-reduced-motion: reduce`, THE App_Shell SHALL keep Reduced_Motion_Mode active regardless of the value of the manual reduced-motion setting.
13. THE App_Shell SHALL meet the contrast ratios defined in design-system.md for all text and interactive controls in both Mortal_View and Haunted_View.
14. THE App_Shell SHALL contain no detection logic, SHALL NOT import from `src/detection/`, and SHALL NOT make any network request.

### Requirement 9: Sample tests

**User Story:** As a developer, I want sample unit, property-based and accessibility tests, so that the testing setup is proven.

#### Acceptance Criteria

1. THE Test_Suite SHALL include at least 1 example-based Vitest test that asserts on a specific expected output for a specific input and contains at least 1 assertion.
2. THE Test_Suite SHALL include at least 1 PBT that uses fast-check and is configured to run at least 100 iterations (numRuns of 100 or more) per property.
3. THE Test_Suite SHALL include at least 1 test that renders the App_Shell once in Mortal_View and once in Haunted_View and asserts that axe-core reports 0 violations in each view.
4. THE Test_Suite SHALL include at least 1 test that renders the App_Shell, activates the View_Toggle, and asserts that the displayed view changes from Mortal_View to Haunted_View and then back to Mortal_View.
5. WHEN `vitest --run` is executed on a clean checkout after dependencies are installed, THE Test_Suite SHALL complete with exit code 0, 0 failed tests, 0 skipped tests, and 0 tests marked as todo.
6. THE Test_Suite SHALL include, immediately above or inside each PBT, a comment that states in one sentence the property being checked.
7. IF any test in the Test_Suite fails, THEN THE Test_Suite SHALL report the name of each failing test and finish with a non-zero exit code.
8. THE Test_Suite SHALL include a test that computes the WCAG 2.1 contrast ratio of each declared text/background token pair from the design tokens of both views and asserts that each ratio meets the thresholds in design-system.md, because jsdom cannot compute rendered colour contrast.
9. WHERE the contrast test of criterion 8 is written as a PBT, THE Test_Suite SHALL generate random colour pairs and verify that the contrast ratio function is symmetric in its arguments and always lies between 1 and 21.

### Requirement 10: Agent hooks

**User Story:** As a developer, I want agent hooks for tests, rule tests, accessibility and the journal, so that quality and documentation happen automatically.

#### Acceptance Criteria

1. THE Project SHALL store each of the four Hooks (run-tests, rule-tests, a11y-check, journal) as a separate JSON file at `.kiro/hooks/<id>.json` that parses as valid JSON and conforms to the Hook schema, with `version` equal to `"v1"`, a non-empty `name`, a `trigger` from the supported trigger list, and an `action` of type `command` with a `command` string or type `agent` with a `prompt` string.
2. WHEN a file whose path ends in `.ts` or `.tsx` and contains a `src` directory segment (separated by `/` or `\`) is saved, THE run-tests Hook SHALL run `npx vitest --run` as a command action on the PostFileSave trigger, using a matcher that is not anchored to the start of the path and accepts both `/` and `\` separators.
3. WHEN a Detection_Rule_File that does not end in `.test.ts` is created or saved, THE rule-tests Hook SHALL start an agent action on the PostFileCreate and PostFileSave triggers instructing the agent to create or update the matching `<rule>.test.ts` in the same directory, including a PBT using fast-check where the rule's behaviour can be expressed as a property over generated input, using a matcher that accepts both `/` and `\` separators and is not anchored to the start of the path.
4. WHEN a UI_File that does not end in `.test.ts` or `.test.tsx` is created or saved, THE a11y-check Hook SHALL start an agent action on the PostFileCreate and PostFileSave triggers instructing the agent to check accessibility and colour contrast against `design-system.md` and report each violation with the file name and the rule violated, using a matcher that accepts both `/` and `\` separators and is not anchored to the start of the path.
5. WHEN a task execution completes, THE journal Hook SHALL start an agent action on the PostTaskExec trigger, without a matcher, instructing the agent to append one entry in the Journal entry line format defined in Requirement 11, with a date in `YYYY-MM-DD` format and a description of at most 2 sentences, naming the Kiro feature used and how it was used.
6. THE rule-tests Hook matcher and THE a11y-check Hook matcher SHALL NOT match any path ending in `.test.ts` or `.test.tsx`, so that saving a test file starts neither Hook.
7. THE Hook matchers SHALL be JavaScript-compatible regular expressions, and WHERE a Hook needs both the PostFileCreate and PostFileSave triggers, THE Hook file SHALL contain one entry per trigger in its `hooks` array.
8. THE rule-tests Hook prompt and THE a11y-check Hook prompt SHALL each instruct the agent not to edit files outside the test file or component scope of the saved target.
9. IF a Hook cannot be created automatically, THEN THE agent SHALL list, for each affected Hook, its exact name, trigger, matcher, action type, and command or prompt for the User to add manually, and SHALL report that Hook as not created.
10. THE tech.md file or structure.md file SHALL list all four Hooks, each with its name, trigger, and matcher (or "none" where no matcher applies).

### Requirement 11: Journal

**User Story:** As a contest entrant, I want a Kiro usage journal, so that I can show how Kiro built the project.

#### Acceptance Criteria

1. WHEN the foundation step completes, THE Project SHALL contain the Journal as a UTF-8 Markdown file at `docs/kiro-journal.md`.
2. THE Journal SHALL begin with a single level-1 heading, followed by a purpose paragraph of 1 to 3 sentences and no more than 60 words, stating that the file logs how Kiro features were used to build the Project.
3. THE Journal SHALL contain a first set of entries dated with the creation date, with one entry each for specs, steering and hooks, and each entry SHALL describe how that feature was used in the foundation step.
4. THE Journal SHALL format every entry as one line of the form `- YYYY-MM-DD | <Kiro feature> | <description>`, where the description has 1 to 2 sentences.
5. IF the Journal contains an entry line that does not match the format in criterion 4, THEN THE Repo_Conformance_Tests SHALL fail and report the invalid entry.

### Requirement 12: README

**User Story:** As a visitor, I want a basic README, so that I understand the project and can run it.

#### Acceptance Criteria

1. THE Project SHALL contain a file named `README.md` in the Project root, and the file SHALL be non-empty UTF-8 Markdown.
2. THE README SHALL contain the pitch line "Every scam has a ghost hiding in it. Phantom Inbox makes it visible." verbatim.
3. THE README SHALL contain a description of each of the three features (Possession Check, Exorcism, Séance), with one to three sentences per feature, and SHALL mark each feature as planned.
4. THE README SHALL contain a privacy promise stating that all processing runs in the browser and that no message is stored or sent anywhere.
5. THE README SHALL contain a statement that results are never 100% certain and are not a guarantee that a message is safe or a scam.
6. THE README SHALL list one command each for installing dependencies, starting the development server, running the Test_Suite once with `vitest --run`, and producing a production build, and each listed command SHALL match a script or tool defined in the Scaffold.
7. THE README SHALL state that the license is MIT and SHALL contain a Markdown link whose target is the `LICENSE` file in the Project root.
8. IF the README references a command, file, or link target that does not exist in the Project, THEN THE Project SHALL be considered non-compliant with this requirement.

### Requirement 13: License

**User Story:** As a maintainer, I want an MIT license, so that the project is openly usable.

#### Acceptance Criteria

1. THE Project SHALL contain a `LICENSE` file at the Project root whose body is the standard MIT License text, including the permission grant and the warranty disclaimer, with no additional license terms.
2. THE `LICENSE` file SHALL contain the exact line "Copyright (c) 2026 Phantom Inbox contributors" immediately preceding the permission grant paragraph.
3. THE `package.json` file SHALL declare the field `"license"` with the exact value `"MIT"`.
4. IF the `LICENSE` file is missing, is empty, or does not contain the copyright line from criterion 2, THEN THE Repo_Conformance_Tests SHALL report at least one failing test that identifies the `LICENSE` file as the cause.
5. IF the `package.json` `"license"` value is absent or is not `"MIT"`, THEN THE Repo_Conformance_Tests SHALL report at least one failing test that identifies the `package.json` license field as the cause.

### Requirement 14: Git ignore and repository

**User Story:** As a developer, I want a correct .gitignore and git repository, so that Kiro configuration is versioned and build artefacts are not.

#### Acceptance Criteria

1. THE Project SHALL contain a `.gitignore` file in the Project root that ignores `node_modules/`, `dist/`, the coverage output directory (`coverage/`), and local environment files (`.env` and `.env.*`, excluding `.env.example`).
2. THE `.gitignore` file SHALL contain no pattern that matches `.kiro/` or any file or directory inside it, including `.kiro/steering/`, `.kiro/hooks/`, and `.kiro/specs/`.
3. WHEN the foundation step starts and the Project root contains no `.git` directory, THE agent SHALL run `git init` in the Project root, after which `git rev-parse --is-inside-work-tree` SHALL output `true`.
4. IF a Repository already exists in the Project root when the foundation step starts, THEN THE agent SHALL leave the existing Repository and its commit history unchanged and SHALL NOT run `git init`.
5. WHEN `git check-ignore .kiro/steering/product.md` is run in the Project root, THE Repository SHALL report that the path is not ignored by exiting with status code 1 and printing no output.
6. WHEN `git check-ignore node_modules/x dist/x coverage/x .env` is run in the Project root, THE Repository SHALL report each of the four paths as ignored by printing all four paths and exiting with status code 0.

### Requirement 15: Initial commit

**User Story:** As a developer, I want a single clear commit, so that the foundation is a clean starting point.

#### Acceptance Criteria

1. WHEN the Test_Suite passes with zero failures and the typecheck, lint and build commands each exit with code 0, THE agent SHALL create exactly one commit in the Repository containing the foundation files, and the Repository SHALL contain exactly one commit after the operation.
2. IF the Test_Suite reports one or more failures or the typecheck, lint or build command exits with a non-zero code, THEN THE agent SHALL NOT create the commit, SHALL leave all files uncommitted, and SHALL report the failing check to the User.
3. WHEN the commit is created, THE commit message SHALL have a subject line of 1 to 72 characters starting with an imperative verb, followed by one blank line, followed by a body that mentions each of: Steering_Docs, Scaffold, Hooks, and LICENSE.
4. WHEN the commit is created, THE commit SHALL include every file under `.kiro/steering/`, `.kiro/hooks/`, `.kiro/specs/phantom-inbox-foundation/`, `src/` and `tests/`, plus `package.json`, the package lockfile, `index.html`, the configuration files (TypeScript, Vite, Vitest and ESLint configuration), README, LICENSE, `.gitignore`, and the Journal.
5. WHEN the commit is created, THE commit SHALL exclude `node_modules/` and `dist/`, and `git ls-files` SHALL list zero paths beginning with either directory name.
6. WHEN the commit is created, THE agent SHALL leave the Repository working tree clean, so that `git status --porcelain` outputs zero lines immediately after the commit.
7. IF the commit command fails, THEN THE agent SHALL leave the working tree files unchanged, SHALL report the failure reason to the User, and SHALL NOT retry more than once.
8. WHEN the commit is created, THE agent SHALL report to the User the list of files and folders created, each key decision taken with its reason, and each hook setting the User must add manually, stating "none" for any category that is empty.

### Requirement 16: Non-functional constraints

**User Story:** As a user, I want the foundation to honour the product rules, so that later features inherit them.

#### Acceptance Criteria

1. WHILE the built Scaffold is running in a browser, THE Scaffold SHALL complete page load and the View_Toggle switch with zero network requests to any origin other than the origin serving its static files.
2. WHEN the production build completes, THE Scaffold SHALL produce an output consisting solely of static files that load and run when served by a plain static file server with no server-side configuration (no rewrite rules, no custom headers required, no server runtime), because the CSP is delivered by the meta tag in `index.html`.
3. THE Scaffold SHALL include zero analytics, tracking or third-party script dependencies, meaning no `<script>` element or runtime import in the built output loads code from a different origin.
4. WHILE the Scaffold is running, THE Scaffold SHALL write to localStorage, sessionStorage, IndexedDB and cookies only for the User's view preference (Mortal_View or Haunted_View) and the manual reduced-motion preference, and SHALL write no other keys or records, and no message content.
5. IF reading or writing a stored preference fails (storage unavailable, blocked or quota exceeded), THEN THE Scaffold SHALL continue to run using in-memory defaults (Mortal_View, and Reduced_Motion_Mode following the system setting) without displaying an error or crashing.
6. WHEN the agent delivers the final report, THE agent SHALL include, for each of the stack choices, hook design, CSP and view tokens, one explanation stating the decision made and at least one reason for it.
