# Implementation Plan: Possession Check UI

## Overview

TypeScript (strict) and React. The screen lives in `src/features/possession-check/`, the `.eml` parser in `src/email/`. All message content is rendered as React text, never as HTML.

## Tasks

- [x] 1. Pure helpers
  - [x] 1.1 Implement `segmentText` in `segments.ts`
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 1.2 Write property tests for segmentation in `segments.test.ts`
    - **Property 1: Segments rebuild the text and mark exactly the covered characters**
    - **Property 2: Every span ends exactly once**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  - [x] 1.3 Implement `parseEml` in `src/email/parse-eml.ts` (unfolding, RFC 2047 and RFC 2231 decoding, multipart, base64, quoted-printable, HTML to text with `text <url>` links, attachment names)
    - _Requirements: 2.3, 2.6_
  - [x] 1.4 Write example and property tests in `parse-eml.test.ts`
    - **Property 3: Email bodies survive an .eml round trip**
    - **Property 4: Attachment names survive an .eml round trip**
    - **Validates: Requirements 2.3**

- [x] 2. Components
  - [x] 2.1 `SamplePicker`, `EmlPicker` (button, drop zone, 5 MB and file-type checks) and `EmailDetails`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3_
  - [x] 2.2 `VerdictIcon` (octagon, triangle, circle with tick), `FlagCard` and `HighlightedText`
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1, 7.3, 7.4, 7.6_
  - [x] 2.3 `ResultPanel` with verdict, score text and meter, advice, disclaimer, body, header and attachment highlights, and focus on the heading
    - _Requirements: 4.3, 5.3, 5.4, 6.3, 7.5_
  - [x] 2.4 `PossessionCheck` state, empty-check alert, privacy note, and clearing the result on edit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.4, 4.5_

- [x] 3. Styling and shell
  - [x] 3.1 Add `--color-verdict-*` and `--color-highlight` tokens to both views and extend `tokens.test.ts`
    - _Requirements: 5.5, 7.4_
  - [x] 3.2 Write mobile-first `possession-check.css` using tokens only, mount the screen in `App.tsx`, and update the steering docs
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 4. Component tests
  - [x] 4.1 Write `PossessionCheck.test.tsx`
    - Flows: pasting and checking, the empty alert, all 15 samples, picking and dropping an `.eml`, wrong-file and no-header errors, removing details, clearing the result on edit.
    - Accessibility: plain-text rendering, focus on the result, a keyboard-only flow, and axe before and after a check in both views.
    - _Requirements: 9.1, 8.2, 8.3, 8.5_

- [x] 5. Checkpoint and delivery
  - [x] 5.1 Run typecheck, lint, test and build
    - _Requirements: 9.3_
  - [x] 5.2 Append a journal entry and create one commit
    - _Requirements: 9.4_

## Notes

- A component test exposed that phrase rules could start a match inside a URL (`kyc-99` in `bit.ly/kyc-99`). The engine now skips phrase matches that start inside a link, with a regression test.
- 471 tests pass.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["5.2"] }
  ]
}
```