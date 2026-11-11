# Requirements Document

## Introduction

Open-Source Boosts makes the Phantom Inbox detection engine smarter at spotting fake web addresses, and proves it better with property-based tests and an offline evaluation script. It uses open-source data and libraries whose licences allow redistribution. Everything still runs in the browser with zero runtime network calls.

Findings from the licence research shape this spec (details, evidence and URLs are in `design.md`). Where a licence sentence has not yet been read from the primary source, the design states a safe default: SKIP that item and report it.
- The Tranco list is **not** added. Its own page blends components with non-commercial and share-alike terms and states no licence for the list. Redistribution of a derived subset is unclear.
- The Majestic Million (CC BY 3.0) replaces it for the generated brand list ONLY IF the licence sentence is read on majestic.com during implementation. Otherwise the typosquat list is curated only.
- No Freesound sound is added (login required). A chime made in code with the Web Audio API is used instead.
- Creepster stays as the heading font (SIL OFL 1.1, already self-hosted).
- The Kiro power uses `plugin.json` as the current Kiro docs specify, confirmed again by re-fetching the page.
- `tldts` measures about 47 kB gzip, so tldts, the confusables map and the brand list load in one lazy chunk, `detection-data`.

## Glossary

- **Engine**: the code in `src/detection/`, called through `analyse()`.
- **Registrable_Domain**: the part of a host an organisation registers, found with the Public Suffix List. For `a.b.example.co.in` it is `example.co.in`.
- **Brand_Domain**: a Registrable_Domain that a listed brand really uses.
- **Skeleton**: a host label after every look-alike character is mapped to the Latin letter or digit it imitates.
- **Homograph**: a domain that looks like a brand because it uses look-alike or mixed-script characters.
- **Typosquat**: a domain one or two typing mistakes away from a brand's domain.
- **Brand_List**: the India-focused `BRANDS` in `brands.ts` (priority) plus the generated list.
- **Confusables_Map**: the generated table of non-Latin characters that look like Latin letters or digits.
- **Detection_Data**: the lazy chunk `detection-data` holding tldts, the Confusables_Map and the generated brands.
- **Pre_Load_Mode**: the state before Detection_Data has loaded, where the Engine uses the curated brands, the hand-made stand-ins and the old suffix table.
- **First_Paint_Files**: the script, stylesheet and modulepreload files referenced by `dist/index.html`.
- **Eval**: the dev-only script `scripts/eval/run.ts` that measures the Engine on local mail corpora.
- **Predicted_Scam**: a message the Engine rates `suspicious` or `likely scam`.

## Requirements

### Requirement 1: Homograph detection

**User Story:** As a user, I want to be warned when a link looks like a known brand but is built from look-alike letters, so that I do not trust it.

#### Acceptance Criteria

1. THE Engine SHALL map characters to Latin letters and digits using a Confusables_Map generated from Unicode `confusables.txt`. The generator SHALL keep an entry when the source is a single non-ASCII code point, the target string lower-cased matches `^[a-z0-9]{1,2}$`, and one pass is a fixed point (an entry is dropped if its lower-cased target contains any source key of the kept map), so that `skeleton(skeleton(x))` equals `skeleton(x)`.
2. THE Confusables_Map file SHALL start with a header that records the Unicode data version and date, the source URL and the Unicode License v3 notice.
3. WHEN a host contains a label starting with `xn--`, THE Engine SHALL decode it with an RFC 3492 Punycode decoder before comparing it.
4. WHEN the Skeleton of a host's registrable name equals the name of a Brand_Domain and the host is not that Brand_Domain, THE Engine SHALL raise a `lookalike-domain` red flag.
5. WHEN a decoded host has a mixed-script label, THE Engine SHALL raise a `lookalike-domain` red flag even when no brand matches. A label is mixed when it uses two or more distinct scripts, found with Unicode property escapes and ignoring `Script=Common` and `Script=Inherited` characters (digits, hyphens, combining marks). THE Engine SHALL also raise the flag for an `xn--` label that cannot be decoded. THE Engine SHALL NOT flag a single-script label (for example Devanagari, Tamil, Cyrillic-only or accented Latin) unless its Skeleton equals a Brand_Domain name. This narrows the current behaviour, which flags any non-ASCII host, and it is a deliberate change listed in the journal.
6. WHEN a flag is raised for a host that contained `xn--`, THE flag reason SHALL include the decoded host as plain text, for example `Decoded from xn--pypal-4ve.com: pаypal.com`, with control, format and bidi characters replaced by `U+XXXX` text and the decoded host cut to 80 characters.
7. THE reason SHALL be one plain-English line, SHALL NOT claim certainty, and SHALL NOT be a link.
8. THE Exorcism family warning SHALL stay a fixed template and SHALL NOT include the decoded host or any brand text from the checked message.
9. IF the Punycode decoder gets invalid input, THEN it SHALL return the original label unchanged and SHALL NOT throw.
10. THE hosts `bank-1.in` and `café.in` SHALL NOT be flagged as mixed-script, and a Latin plus Greek label and a Latin plus Cyrillic label SHALL be flagged.

### Requirement 2: Real-domain parsing

**User Story:** As a user, I want the checker to judge the real owner of a link, so that `paypal.com.secure-login.xyz` is not mistaken for PayPal.

#### Acceptance Criteria

1. THE Engine SHALL find the Registrable_Domain of every host with the `tldts` package, using ICANN suffixes only (`allowPrivateDomains` off).
2. WHEN a host is `paypal.com.secure-login.xyz`, THE Registrable_Domain SHALL be `secure-login.xyz`.
3. WHEN a brand name appears only in the subdomain part of a host whose Registrable_Domain is not a Brand_Domain, THE Engine SHALL raise a `lookalike-domain` red flag whose reason says the brand name is only in front of someone else's domain.
4. THE parser SHALL handle IPv4 and IPv6 hosts, `localhost`, a trailing dot, upper-case letters, raw Unicode hosts and `xn--` labels without throwing. It SHALL lower-case and trim the host, pass it to `tldts` in the form received, and return the registrable domain in that same form (`pаypal.com` with a Cyrillic а returns itself; `xn--pypal-4ve.com` returns itself).
5. WHEN a host is an IP address or has no public suffix, THE parser SHALL return the host itself as its Registrable_Domain.
6. THE existing rules `risky-tld`, `url-shortener`, `link-text-mismatch` and `ip-link` SHALL use the same Registrable_Domain function as `lookalike-domain`.
7. THE hand-written suffix list in `links.ts` SHALL be removed from `links.ts`. It MAY live on in `domain-fallback.ts` for Pre_Load_Mode only. The `KNOWN_TLDS` list used only to decide whether a bare word is a link MAY stay.

### Requirement 3: Typosquat detection

**User Story:** As a user, I want a warning when a link is a small typing change away from a famous site, so that I notice tricks like `gooogle.com`.

#### Acceptance Criteria

1. THE generated brands SHALL be used only for the typosquat check and for a whole-label homograph match on names of 6 or more characters. They SHALL NOT be used for brand-in-subdomain, hyphen-piece or "contains" matching, so `mail.example.com` and `my-office-deals.com` are not flagged.
2. THE Brand_List SHALL contain the hand-written India-focused brands and the top 1,000 domains of the Majestic Million (CC BY 3.0), generated by `scripts/gen-brands.mjs` into `src/detection/data/top-brands.ts`, ONLY IF the Majestic licence sentence has been read on majestic.com and recorded. IF it has not been read, THEN the Brand_List SHALL be curated only, and the final report SHALL say so.
3. THE generated file SHALL start with a header that records the source URL, the download date, the count, the CC BY 3.0 attribution with the licence URL `https://creativecommons.org/licenses/by/3.0/` (also shown in `THIRD_PARTY_NOTICES.md` and the README) and the SHA-256 of the kept rows (the first N domains, joined with newlines, UTF-8). The script SHALL NOT claim a hash of the whole downloaded file. The script SHALL apply a documented `EXCLUDE` deny-list (adult, ad-network and similar domains) before the cut and print how many rows it dropped.
4. THE Engine SHALL decide that a host "is the brand" only by raw registrable-domain equality with a Brand_Domain, never by Skeleton equality. A "confusable character" is any character or sequence that the Skeleton function changes, including `0 1 3 5 |`, `rn` and `vv`, so `g00gle.com` and `paypa1.com` are flagged as homographs and never exempted as the brand.
5. WHEN the Skeleton of a host's registrable name differs from a curated brand name by an edit distance of 1, and both names are at least 5 characters long, THE Engine SHALL raise a `lookalike-domain` red flag. For a generated brand name the same applies only when both names are at least 6 characters long, start with the same letter and differ in length by at most 1.
6. WHEN the distance is 2, and both names are at least 8 characters long and start with the same letter, THE Engine SHALL raise the flag.
7. THE Engine SHALL NOT flag a host whose Registrable_Domain is a Brand_Domain, or any subdomain of one.
8. THE Engine SHALL NOT flag a host whose Registrable_Domain is itself in the Brand_List.
9. THE Engine SHALL NOT flag a host whose registrable name equals a brand's name with a different suffix, unless the existing curated-brand check already flags it.
10. THE reason for a curated brand SHALL name the brand and say the address is a small spelling change away from it. THE reason for a generated brand SHALL use the brand's domain only (for example `... a small spelling change away from google.com, so it may be an imitation of that site.`) and SHALL NOT use an invented display name.
11. WHERE `npm run gen:brands` cannot download the source, THE script SHALL leave the committed file unchanged, print the reason and exit with code 1.
12. THE Engine SHALL NOT add a Tranco-derived list.

### Requirement 4: Property-based tests

**User Story:** As the maintainer, I want rules checked against many generated inputs, so that edge cases do not slip through.

#### Acceptance Criteria

1. THE test suite SHALL include a property: any Brand_Domain with one confusable swap in its name is flagged.
2. THE test suite SHALL include a property: a Brand_Domain, `www.` plus a Brand_Domain, and any subdomain of a Brand_Domain are never flagged as their own lookalike.
3. THE test suite SHALL include properties that the domain parser, link finder, Punycode decoder and `analyse()` never throw on arbitrary strings.
4. THE test suite SHALL include properties for determinism of `analyse()`, idempotence of Registrable_Domain, symmetry and the triangle bound of edit distance, and idempotence of `skeleton`.
5. EVERY property SHALL run at least 100 times and SHALL have a one-sentence comment above it stating the property.
6. THE property tests SHALL sit next to the code they test and SHALL run against the full Detection_Data.

### Requirement 5: Evaluation script

**User Story:** As the maintainer, I want precision, recall and false-positive numbers on real mail, so that I can show the Engine works and spot regressions.

#### Acceptance Criteria

1. THE command `npm run eval` SHALL read every regular file (not only `.eml`) from `--phish <dir>` (positives) and `--ham <dir>` (negatives), defaulting to `eval-data/phish` and `eval-data/ham`.
2. THE script SHALL treat a file whose first line starts with `From ` as an mbox. THE splitter SHALL always drop the `From ` envelope line of each message before calling `parseEml`, SHALL split further messages on `From ` lines that follow a blank line, and SHALL unescape `>From ` in bodies. THE script SHALL treat any other file (such as a SpamAssassin message without an envelope line) as one message, SHALL skip files named `cmds` and files over 20 MB and list them, SHALL parse each message with `parseEml` and SHALL call the real `analyse()` after `ensureDetectionData()`.
3. THE script SHALL treat a message as Predicted_Scam when its verdict is `suspicious` or `likely scam`, and SHALL also print results where only `likely scam` counts.
4. THE script SHALL print a table with TP, FP, TN, FN, precision, recall, false-positive rate, message count and skipped files.
5. THE script SHALL be dev-only: not imported by `src/`, not copied to `dist/`, and its dependency (`tsx`) SHALL be a pinned dev dependency.
6. THE folder `eval-data/` SHALL be listed in `.gitignore`, and a conformance test SHALL fail if it is not.
7. THE repo SHALL NOT contain any downloaded corpus.
8. THE eval's pure logic (mbox splitting, file discovery, metrics) SHALL have unit tests next to it under `scripts/eval/`, covering a single message with a `From ` envelope line, the same message without it (parsed headers equal), and a multi-message mbox with `>From ` escapes. THE Vitest `include` list SHALL cover `scripts/**/*.test.ts` so they run in `npm test`.
9. WHERE `eval-data/` does not exist, THE script SHALL exit with code 2 and a download hint, unless `--smoke` is given, which runs on made-up fixtures in `scripts/eval/fixtures/`.
10. `docs/EVAL.md` SHALL state which run produced each table. Numbers from the made-up fixtures SHALL be labelled "smoke test on synthetic samples, not the real corpora". Real numbers SHALL appear only if the corpora were present.
11. THE function `toAnalysisInput` that builds the `AnalysisInput` from a parsed email SHALL live in `src/features/possession-check/to-analysis-input.ts` and be used by both the screen and Eval. `src/email/` SHALL NOT import `src/detection/`.

### Requirement 6: Design polish

**User Story:** As a user, I want headings with a spooky face that stays readable, and a quiet optional sound.

#### Acceptance Criteria

1. THE heading font SHALL remain self-hosted `@fontsource/creepster` (SIL OFL 1.1) in Haunted view headings only, and body text SHALL keep the body font.
2. THE Exorcism screen SHALL offer a sound toggle button that is off by default, has a visible text label, `aria-pressed`, a height of at least 44px and works with the keyboard.
3. WHEN the sound is on and a step checkbox changes to checked, or a Copy action reports success, THE app SHALL play one short, soft tone generated with the Web Audio API. Unticking a step, a failed copy and the Share button SHALL NOT play it. Each case has its own test.
4. THE app SHALL NOT play any sound without an explicit user action, SHALL NOT autoplay, and SHALL NOT fetch any audio file.
5. THE sound setting SHALL live in memory only and SHALL NOT be written to any storage.
6. WHERE reduced motion is on, THE toggle SHALL remain available and nothing SHALL animate because of it.
7. IF the browser has no Web Audio support or blocks it, THEN the toggle SHALL still work visually and no error SHALL be shown.
8. THE app SHALL NOT include a Freesound file.

### Requirement 7: Kiro power

**User Story:** As a Kiro user, I want a "phishing-forensics" power, so that the agent knows how this repo detects phishing when I mention it.

#### Acceptance Criteria

1. THE repo SHALL contain `powers/phishing-forensics/plugin.json` (or the file the re-fetched kiro.dev page requires, with any deviation reported) with `$schema`, `name` (`phishing-forensics`), `version`, `description`, `author` and `keywords` that include `phishing`, `homograph`, `punycode`, `typosquat`, `scam`, `confusables`.
2. THE power SHALL contain `skills/detection-rules/SKILL.md` and `skills/evaluation/SKILL.md` with `name` and `description` frontmatter.
3. THE skills SHALL describe every rule file in `src/detection/rules/`, the test workflow, the data regeneration scripts and how to run Eval, and every file path and npm script they name SHALL exist.
4. THE power SHALL NOT include an `mcp.json`, because it needs no MCP server.
5. THE final report SHALL say whether the power was seen as installed or activated, and SHALL say "not confirmed" unless a Kiro tool showed it.

### Requirement 8: Detection hook

**User Story:** As the maintainer, I want the detection tests to run when I save a detection file.

#### Acceptance Criteria

1. THE repo SHALL contain `.kiro/hooks/detection-tests.json` with one hook named `detection-tests`, trigger `PostFileSave`, matcher `(^|[/\\])src[/\\]detection[/\\].*\.tsx?$` and command `npx vitest --run src/detection`.
2. `tech.md` and `structure.md` SHALL list the hook and its matcher, and `tests/repo-conformance.test.ts` SHALL check the hook file against both documents.
3. THE command SHALL run once and exit, and SHALL work in Windows PowerShell.

### Requirement 9: Licences and self-hosting

**User Story:** As the maintainer, I want every borrowed asset recorded, so that the project can be redistributed safely.

#### Acceptance Criteria

1. `THIRD_PARTY_NOTICES.md` SHALL list, for each added dependency, data file, font and tool, its name, version, licence and source URL, and SHALL keep the existing entries. Every new row SHALL state its evidence (read in package, or read on page with the date) and SHALL state the SKIP default if the licence could not be read.
2. WHERE a licence requires its text to travel with the files, THE text SHALL be copied to `public/licenses/`. THE notices SHALL state that the Public Suffix List data (MPL-2.0) is compiled into our bundle through `tldts` (MIT), SHALL ship the MPL-2.0 text in `public/licenses/`, and SHALL give the source URLs for the Public Suffix List and for `tldts`.
3. THE build SHALL load nothing from another origin. `csp.ts`, `vercel.json` and `dist/index.html` SHALL stay in sync and unchanged.
4. THE conformance tests SHALL fail if `package.json` has a version with `^`, `~` or a range.
5. THE conformance tests SHALL be updated for the new scripts: the expected script list SHALL be `build`, `dev`, `eval`, `gen:brands`, `gen:confusables`, `lint`, `preview`, `test`, `typecheck`; the README `npm run` name check SHALL accept names with a colon; `tech.md` SHALL document each new script and the new Stack entries (`tldts`, `tsx`).
6. IF a licence cannot be read from its primary source, THEN that item SHALL be skipped, its fallback in `design.md` SHALL apply, and the final report SHALL name it.

### Requirement 10: Lean bundle and no regressions

**User Story:** As a user on a phone, I want the page to stay fast.

#### Acceptance Criteria

1. THE gzip size of the main JS and CSS and of each chunk SHALL be recorded before the first change (see `.agents/tasks/osb/baseline.md`) and after the last.
2. THE added gzip size summed over First_Paint_Files SHALL be at most 25 kB, measured by `scripts/size-report.mjs`, and the final build check SHALL fail if it is exceeded or if `dist/index.html` references the `detection-data` chunk.
3. THE `detection-data` chunk SHALL be reported on its own line with a ceiling of 75 kB gzip, and the check SHALL fail above it.
4. THE public signature of `analyse()` SHALL stay synchronous and unchanged.
5. ALL 821 existing tests SHALL still pass without being weakened, and SHALL run against full Detection_Data through the test setup. Expected values MAY change only where a requirement here changes the behaviour, and each such change SHALL be listed in the journal, including the narrowing in Requirement 1.5.
6. `npm run typecheck`, `npm run lint` (zero warnings), `npm test` and `npm run build` SHALL pass.

### Requirement 11: Lazy detection data

**User Story:** As a user on a slow phone, I want the page to appear quickly and the heavy detection data to load afterwards.

#### Acceptance Criteria

1. `tldts`, the Confusables_Map and the generated brands SHALL be imported only by `src/detection/data-bundle.ts`, loaded with a dynamic `import()` into one chunk named `detection-data`.
2. `src/detection/index.ts` SHALL export `ensureDetectionData(): Promise<void>`. The promise SHALL be cached, SHALL NOT reject, and a later call SHALL retry after a failed load.
3. THE app SHALL start `ensureDetectionData()` on idle after first paint. `PossessionCheck`'s check handler and the Séance answer handler (`respond` in `Seance.tsx`, which calls `feedbackFor` and therefore `analyse()`) SHALL wait for it before the first `analyse()` WHEN the data is not yet loaded, and SHALL stay fully synchronous WHEN `isDetectionDataLoaded()` is already true, so the existing tests that click and assert at once keep passing.
4. THE existing `src/test-setup.ts` (which already runs `cleanup()` after each test) SHALL be extended to await `ensureDetectionData()` in `beforeAll`, so every test runs against full Detection_Data.
5. BEFORE the data has loaded, THE Engine SHALL run in Pre_Load_Mode: curated brands, the hand-made stand-ins and the old suffix table, no throw, and results identical to the loaded state for inputs that need no Detection_Data. A test SHALL pin both modes and the identity of results for such inputs.
6. ONCE the data has loaded, `analyse()` SHALL be deterministic: the same input gives the same result every time.

## Non-Functional Requirements

- Privacy: no runtime network call. Data scripts MAY download at development time only.
- Wording: reasons use likelihood words and never claim certainty.
- Accessibility: new UI (the sound toggle) meets the design-system rules for focus, target size and contrast.

## Out of Scope

- Tranco-derived data (licence unclear, see Introduction).
- Freesound audio files.
- Checking whether a domain is really registered, or any live lookup.
- Changing the CSP, `vercel.json` headers or the OCR files.
- Committing or shipping any evaluation corpus.
