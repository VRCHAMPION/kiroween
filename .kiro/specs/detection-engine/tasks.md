# Implementation Plan: Detection Engine

## Overview

TypeScript (strict), pure functions only. Rules live one per file in `src/detection/rules/` with a co-located test. Shared helpers and the rule registry live in `src/detection/` so the rule-tests hook only fires on real rules.

## Tasks

- [x] 1. Core types and helpers
  - [x] 1.1 Define `types.ts` (flag types, `RedFlag`, `AnalysisInput`, `AnalysisResult`, `PreparedInput`, `Rule`) and `flag.ts` (`makeFlag`)
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2_
  - [x] 1.2 Implement `normalise.ts` with NFKC, lower-case, the confusable map, `rn` to `m`, `vv` to `w`, repeated to a fixed point
    - _Requirements: 8.1, 8.2_
  - [x]* 1.3 Write property test for normaliser idempotence in `normalise.test.ts`
    - **Property 3: Homoglyph normalisation is idempotent**
    - **Validates: Requirements 8.2**
  - [x] 1.4 Implement `links.ts` (`findLinks`, `findAnchors`, `parseHost`, `registrableDomain`, `isIpHost`), `brands.ts` and `patterns.ts` (`findPhrases`, negation guard)
    - _Requirements: 4.1, 4.2, 4.7, 5.6_
  - [x] 1.5 Implement `score.ts` (`scoreFlags`, `verdictFor`, cap of 99) and `prepare.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  - [x] 1.6 Write property tests for score range and monotonicity in `score.test.ts`
    - **Property 1: Score stays within 0 to 100**
    - **Property 2: Adding a red flag never lowers the score**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6**

- [x] 2. Link and sender rules, each with a co-located test
  - [x] 2.1 `lookalike-domain.ts` for digit swaps, `rn`, Cyrillic and Greek letters, brand names on unofficial domains, and sender domains in headers
    - _Requirements: 4.1, 4.7_
  - [x] 2.2 `link-text-mismatch.ts` for HTML, Markdown and "text <url>" links
    - _Requirements: 4.2_
  - [x] 2.3 `url-shortener.ts`, `ip-link.ts` and `risky-tld.ts`
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 2.4 `email-auth-fail.ts` for SPF, DKIM and DMARC failures with spans into `headerText`
    - _Requirements: 4.6, 1.5_

- [x] 3. Language rules, each with a co-located test
  - [x] 3.1 `urgency-threats.ts` (types `urgency` and `threat`)
    - _Requirements: 5.1, 5.2_
  - [x] 3.2 `sensitive-info-request.ts`, `remote-access-app.ts` and `payment-request.ts` with the negation guard
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 4. India pattern rules, each with a co-located test
  - [x] 4.1 `kyc-expiry.ts`, `courier-fee.ts` and `electricity-disconnection.ts`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 4.2 `upi-refund.ts`, `job-task-scam.ts` and `digital-arrest.ts`
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 5. Attachment rule with a co-located test
  - [x] 5.1 `risky-attachment.ts` for executables, `.apk`, web pages, macro documents, older Office files and dangerous file names in the body
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6. Engine entry point
  - [x] 6.1 Implement `registry.ts`, `analyse.ts` (dedupe, sort, score, verdict) and the public `index.ts`
    - _Requirements: 1.1, 1.3, 1.4, 2.5, 3.4_
  - [x] 6.2 Write property tests for empty input, exact spans, determinism and the no-certainty wording check in `analyse.test.ts`
    - **Property 1: Score stays within 0 to 100**
    - **Property 4: Empty input looks safe**
    - **Property 5: Spans are exact**
    - **Property 6: Analysis is deterministic and the verdict follows the score**
    - **Validates: Requirements 1.3, 2.2, 2.3, 2.4, 3.1, 3.3, 3.4**

- [x] 7. Sample messages
  - [x] 7.1 Write 15 samples in `src/data/samples.ts` (10 scams covering every flag type, 5 genuine) with made-up names, numbers and domains
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 7.2 Write `src/data/samples.test.ts`: expected verdict per sample, expected flag types, full coverage, genuine samples have no medium or high flags, made-up domains only
    - _Requirements: 9.5, 9.3, 9.2_

- [x] 8. Checkpoint and delivery
  - [x] 8.1 Run typecheck, lint, test and build, and fix any failure at its cause
    - _Requirements: 10.3_
  - [x] 8.2 Append a journal entry and create one commit
    - _Requirements: 10.4_

## Notes

- Results: scams score 72 to 95 (all likely scam), genuine samples score 0 (all looks safe).
- Tasks marked `*` are optional property tests; this one was implemented anyway.
## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "2.1", "2.2", "2.3", "2.4", "3.1", "3.2", "4.1", "4.2", "5.1"] },
    { "id": 3, "tasks": ["6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```