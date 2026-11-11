# Implementation Plan: Séance

## Overview

TypeScript (strict) and React. Pure game and feedback logic, with thin components and the real engine for every answer.

## Tasks

- [x] 1. Sample pool
  - [x] 1.1 Add `topic` to every sample and `safeReasons` to genuine samples, and add 14 new made-up samples (29 in total, 18 scams and 11 genuine)
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 1.2 Update `samples.test.ts` with pool size, topic coverage and safe reasons, and update the older specs that said "15 samples"
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 1.3 Write property tests for scam and genuine samples
    - **Property 3: Every scam sample is checked as suspicious or likely scam**
    - **Property 4: No genuine sample gets a high-severity flag**
    - **Validates: Requirements 2.1, 4.1, 4.4**

- [x] 2. Game logic
  - [x] 2.1 Implement `game.ts` (newGame with 5 to 7 scams and a Fisher-Yates shuffle, answer, next, score, missed topics, false alarms)
    - _Requirements: 2.3, 2.4, 5.2, 5.3_
  - [x] 2.2 Write property tests
    - **Property 1: A game always has 10 unique rounds with a fair mix**
    - **Property 2: The score is always 0 to 10 and counts right answers**
    - **Property 6: Missed topics are exactly the scams answered "real"**
    - **Validates: Requirements 2.3, 4.1, 5.1, 5.2**
  - [x] 2.3 Implement `feedback.ts` (outcomes, main flags, kind wording, topic tips, end summary)
    - _Requirements: 4.1 to 4.6, 5.1, 5.2_
  - [x] 2.4 Write property and example tests
    - **Property 5: Feedback is kind and points at real words**
    - **Validates: Requirements 4.2 to 4.6**

- [x] 3. Components and shell
  - [x] 3.1 Build `RoundCard`, `FeedbackPanel`, `EndScreen`, `SeanceTable` and `Seance` with shortcuts, focus and status announcements, plus `seance.css`
    - _Requirements: 3.1 to 3.4, 4.7, 4.8, 5.1 to 5.4, 6.1 to 6.4, 7.1 to 7.6_
  - [x] 3.2 Add the screen navigation to `App.tsx`, keeping both screens mounted
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 3.3 Write component tests: full game, wrong answers, end screen, keyboard play, focus and announcements, candles, navigation, and axe in both views
    - _Requirements: 1.1, 1.2, 4.2 to 4.8, 5.1 to 5.4, 6.1 to 6.5, 7.2 to 7.5, 8.3_

- [x] 4. Performance, docs and delivery
  - [x] 4.1 Add a Séance scenario to `scripts/perf-mobile.mjs`, run it, and record the results
    - _Requirements: 8.4_
  - [x] 4.2 Update the README, the steering docs and the journal
    - _Requirements: 8.6_
  - [x] 4.3 Run typecheck, lint, test and build, commit "Add Séance real-or-scam training game", and push `main`
    - _Requirements: 8.5, 8.6_

## Notes

- The mobile check measured Séance in Haunted view with candles lit and a missed ghost on screen: 60 fps idle and while scrolling, 0 long tasks, no layout shift, and no animations with reduced motion.
- A component test caught that a "no shaming words" check over the whole feedback panel matched quoted message text such as "dmarc=fail". The check now covers only the game's own words to the player.

- The engine needed no changes: all 14 new samples got their expected verdict on the first run. The scams scored 50 to 95, and the genuine messages scored 0.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2"] },
    { "id": 8, "tasks": ["4.3"] }
  ]
}
```