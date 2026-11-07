# Implementation Plan: Haunted View

## Overview

TypeScript (strict), React, CSS and inline SVG. The engine gains two small additive APIs. The ghost layer lives in `src/features/possession-check/ghosts/`, and the backdrop is a shell component. Every continuous animation uses only `transform` and `opacity`.

## Tasks

- [x] 1. Engine support for ghosts
  - [x] 1.1 Add `destination` to link flags (url-shortener, ip-link, risky-tld, lookalike-domain in the body, link-text-mismatch)
    - _Requirements: 5.1_
  - [x] 1.2 Implement `lookalikeParts(host)` in `brands.ts` by mapping folded brand matches back to source characters, and export it with `parseHost` and `registrableDomain`
    - _Requirements: 4.1, 4.2_
  - [x] 1.3 Write property tests in `src/detection/brands.test.ts`
    - **Property 1: Lookalike parts are exactly the substituted letters**
    - **Property 2: Lookalike parts stay inside the host**
    - **Validates: Requirements 4.1, 4.2**

- [x] 2. Tokens, font and shell
  - [x] 2.1 Add the haunted tokens to both views in `tokens.css`, and document them in `design-system.md`
    - _Requirements: 2.4, 8.3_
  - [x] 2.2 Extend `tokens.test.ts` with ghost text pairs and the candle glow blended at full strength
    - _Requirements: 8.2, 8.3_
  - [x] 2.3 Add `ViewContext`, provide it from `App`, bundle the Creepster latin subset, and render `HauntedBackdrop` in Haunted view only
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.5, 2.6_
  - [x] 2.4 Write `haunted.css`: candle-lit Panels with flickering glow and corner flames, the heading font for h1 to h3, sky, moon, mansion, bats and fog keyframes, all transform and opacity only
    - _Requirements: 2.1, 2.3, 2.4, 8.1, 8.4, 8.5_

- [x] 3. Ghost layer
  - [x] 3.1 Implement `ghost-effects.ts` (`ghostKind`, `isLinkFlag`, `deadlineOf`, `secondsUntilMidnight`, `formatCountdown`, `trueNameFor`, `candleWaxHeight`)
    - _Requirements: 4.4, 4.5, 5.3, 5.4, 7.2_
  - [x] 3.2 Write property and example tests in `ghost-effects.test.ts`
    - **Property 3: The candle never grows as the score rises**
    - **Property 4: Countdown text round-trips**
    - **Property 5: True Name parts point inside the address**
    - **Validates: Requirements 4.4, 5.1, 5.3, 7.2**
  - [x] 3.3 Build `GhostIcon`, `Countdown`, `TrueNameText` and `Ghost` (button, tooltip bubble, Whisper disclosure, Escape handling)
    - _Requirements: 3.2, 3.3, 3.4, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_
  - [x] 3.4 Build `HauntedText`: marks per ghost kind, lookalike letter elements, a ghost after each span, and hover-to-speak on link words
    - _Requirements: 3.1, 3.5, 3.6, 4.1, 4.3, 4.6, 5.2_
  - [x] 3.5 Write `ghosts.css`: ghost buttons of at least 44px, bobbing, twitch, bleed drips, haunting glow, bubble and Whisper styles
    - _Requirements: 3.4, 4.1, 4.3, 4.6, 8.1, 8.5_
  - [x] 3.6 Write `HauntedText.test.tsx`
    - Ghost markup: labels, accessible names, lookalike letters, bleed marks.
    - Countdown: ticking with fake timers, "nothing happened" at zero, static in reduced motion.
    - True Name bubble: hover, focus and Escape. Whisper: toggle with focus kept.
    - Plain-text rendering.
    - _Requirements: 3.1 to 3.6, 4.1 to 4.6, 5.2 to 5.5, 6.1 to 6.4, 8.1_

- [x] 4. Score candle and result panel
  - [x] 4.1 Build `ScoreCandle` with SVG geometry, a flickering flame, a SMIL melt (left out in reduced motion) and a caption
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 4.2 Use `HauntedText` and `ScoreCandle` in `ResultPanel` when the view is haunted, and keep the `<meter>` for assistive technology
    - _Requirements: 3.1, 7.1, 7.4_
  - [x] 4.3 Extend `PossessionCheck.test.tsx`
    - Candle shown in Haunted view only, and shorter for a higher score.
    - Reduced motion has no SMIL.
    - The result survives a view switch, and the view is remembered.
    - Axe passes with a Whisper open.
    - _Requirements: 1.2, 1.4, 2.6, 7.1, 7.2, 7.4, 8.6_

- [x] 5. Mobile performance check
  - [x] 5.1 Write `scripts/perf-mobile.mjs`: a local static server, an installed Chromium browser with a phone viewport and 4x CPU slowdown, load timings, FPS, long tasks, layout shift, request origins, and animation count in reduced motion
    - _Requirements: 10.1, 10.2_
  - [x] 5.2 Run it and write `docs/perf-mobile.md`, then fix anything slow
    - _Requirements: 10.3, 8.5_

- [x] 6. Docs and delivery
  - [x] 6.1 Update the README with a Haunted view section and an assets and licences list, and update `tech.md` and `structure.md`
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 6.2 Run typecheck, lint, test and build
    - _Requirements: 10.4_
  - [x] 6.3 Append a journal entry and create one commit
    - _Requirements: 10.5_

## Notes

- The first mobile run failed on frame rate (47 and 31 fps) and long tasks (21) because window and candle flicker animated shapes inside large SVGs. Moving each flicker into its own overlay SVG fixed it: 54 fps animating, 52 fps scrolling, 0 long tasks. See docs/perf-mobile.md.
- A test caught that ghost button names ran together ("Red flag1KYC"); real spaces now separate the parts.

- Effects are decoration over a text-first result. The verdict text, score text, flag cards and reasons are unchanged and stay the source of truth.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["2.4", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "4.1"] },
    { "id": 4, "tasks": ["3.6", "4.2"] },
    { "id": 5, "tasks": ["4.3"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["5.2"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2"] },
    { "id": 10, "tasks": ["6.3"] }
  ]
}
```