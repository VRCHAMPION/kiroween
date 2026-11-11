# Requirements Document

## Introduction

Séance is the third and last feature of Phantom Inbox: a real-or-scam training game. A game has 10 rounds. Each round shows one made-up SMS, WhatsApp or email message and asks "Real or scam?". After each answer the real detection engine checks the message. The game then shows a kind explanation:
- the main red flags when the player is right;
- the ghost they missed, on the exact words, when they miss a scam;
- a calm reason why the message was fine when they doubt a genuine one, so people do not learn to fear every message.

The end screen shows the score and the scam types to look out for. The game never shames the player and saves nothing.

## Glossary

- **Game**: one play of Séance, made of 10 Rounds.
- **Round**: one sample message shown with the question "Real or scam?".
- **Pool**: the sample messages in `src/data/samples.ts`.
- **Scam_Sample**: a sample whose expected verdict is "likely scam" or "suspicious".
- **Genuine_Sample**: a sample whose expected verdict is "looks safe".
- **Guess**: the player's answer for a Round, "real" or "scam".
- **Outcome**: the result of a Guess: Spotted_Scam, Spotted_Real, Missed_Scam (said real on a scam), or False_Alarm (said scam on a genuine message).
- **Main_Flags**: up to three red flags from the engine, chosen strongest first and one per flag type, shown in feedback.
- **Topic**: what a sample is about, such as "KYC expiry" or "Family message".
- **Feedback**: the panel shown after a Guess.
- **End_Screen**: the summary shown after Round 10.
- **Seance_Table**: the decorative table with 10 candles shown in Haunted view.

## Requirements

### Requirement 1: Open Séance

**User Story:** As a learner, I want to reach the game from the main page, so that I can practise whenever I like.

#### Acceptance Criteria

1. THE Shell SHALL show a navigation with two buttons, "Possession Check" and "Séance", and SHALL mark the current screen with `aria-current="page"`.
2. WHEN the user switches screens, THE Shell SHALL show the chosen screen, move focus to its main heading, and keep the other screen's state (the message being checked, or the game in progress).
3. THE Shell SHALL open on Possession Check, and SHALL NOT store which screen is open.

### Requirement 2: A fair game of 10 rounds

**User Story:** As a learner, I want a fresh mix of messages each game, so that I learn to judge each message rather than remember answers.

#### Acceptance Criteria

1. THE Pool SHALL contain at least 25 made-up messages, using only fake names, numbers and domains.
2. THE scam samples SHALL cover KYC expiry, courier fees, electricity disconnection, UPI refunds, job tasks, digital arrest, lookalike links and risky attachments, and the genuine samples SHALL cover bank alerts, delivery updates, one-time codes, family messages, and bills or receipts.
3. WHEN a Game starts, THE Game SHALL pick 10 different samples, between 5 and 7 Scam_Samples with the rest Genuine_Samples, and SHALL shuffle their order.
4. WHEN the player chooses "Play again", THE Game SHALL start a new Game with a new pick and order.
5. EACH genuine sample SHALL carry at least one plain reason why it is safe, and EACH sample SHALL carry its Topic.

### Requirement 3: Ask "Real or scam?"

**User Story:** As an elderly player, I want one clear question with two big buttons, so that I always know what to do.

#### Acceptance Criteria

1. EACH Round SHALL show "Message N of 10", the channel (SMS, WhatsApp or Email), the sender and subject for emails, any attachment names, and the message text as plain text.
2. EACH Round SHALL ask "Real or scam?" with two large buttons, "Real" and "Scam", each at least 56px high.
3. THE message text SHALL never be rendered as HTML and SHALL never become a link.
4. WHEN a new Round starts, THE Game SHALL move focus to the Round heading.

### Requirement 4: Feedback after each answer

**User Story:** As a learner, I want to understand every answer, so that I learn the tricks instead of just getting a score.

#### Acceptance Criteria

1. WHEN the player answers, THE Game SHALL run the detection engine on that message and show its verdict and haunt score.
2. WHEN the Outcome is Spotted_Scam, THE Feedback SHALL say "Well spotted!" and show the Main_Flags, each with its label, the exact words and the reason.
3. WHEN the Outcome is Missed_Scam, THE Feedback SHALL kindly say the message is a scam that is easy to miss, and SHALL show the Main_Flags on the exact words of the message with their plain-English reasons.
4. WHEN the Outcome is False_Alarm, THE Feedback SHALL calmly say the message is real, praise being careful, and list the sample's reasons why it is safe.
5. WHEN the Outcome is Spotted_Real, THE Feedback SHALL say "Well spotted!" and list the reasons why it is safe.
6. THE Feedback SHALL never use shaming words such as "wrong", "stupid", "silly", "fail" or "fooled", and SHALL describe a sample as a "practice message".
7. WHEN Feedback appears, THE Game SHALL move focus to the Feedback heading and announce the Outcome and the running score in a `role="status"` region.
8. THE Feedback SHALL offer "Next message", or "See your results" after Round 10.

### Requirement 5: End screen

**User Story:** As a learner, I want a kind summary, so that I know what to watch for next time.

#### Acceptance Criteria

1. WHEN Round 10 is done, THE End_Screen SHALL show the score as "You got N out of 10 right", with a kind line that suits the score.
2. THE End_Screen SHALL list each scam Topic the player missed once, each with a one-line tip, or say that no scam was missed.
3. WHEN the player marked genuine messages as scams, THE End_Screen SHALL say how many, calmly.
4. THE End_Screen SHALL offer "Play again", which starts a new Game and moves focus to its first Round.

### Requirement 6: Keyboard and screen reader play

**User Story:** As a keyboard or screen reader user, I want to play the whole game without a mouse, so that I can practise like everyone else.

#### Acceptance Criteria

1. WHILE a Round is waiting for an answer, pressing R SHALL answer "Real" and pressing S SHALL answer "Scam".
2. WHILE Feedback is shown, pressing Enter SHALL go to the next Round or the End_Screen.
3. THE shortcuts SHALL work only on the Séance screen, only without Ctrl, Alt or Meta, never while typing in a text field, and Enter SHALL NOT be taken over when a button or link has focus.
4. THE Real and Scam buttons SHALL expose their shortcut with `aria-keyshortcuts`, and the screen SHALL explain the shortcuts in visible text.
5. WHEN axe-core runs on a Round, on Feedback and on the End_Screen in Mortal and Haunted views, THE Test_Suite SHALL report no WCAG A or AA violations.

### Requirement 7: Mortal and Haunted design

**User Story:** As a player, I want the game to look right in both views, so that it is calm for elders and memorable for the contest.

#### Acceptance Criteria

1. IN Mortal view, THE Game SHALL use plain cards, large text, and the big Real and Scam buttons, with a text line for progress and score.
2. IN Haunted view, THE Game SHALL show the Seance_Table with 10 candles, and the number of lit candles SHALL equal the number of right answers so far.
3. IN Haunted view, WHEN the Outcome is Missed_Scam, THE missed ghosts SHALL appear on the exact words and drift up from them, and pressing a ghost SHALL open its reason.
4. THE Seance_Table SHALL be hidden from assistive technology, and every text block SHALL keep the same words as in Mortal view.
5. WHILE reduced-motion mode is active, THE candles SHALL not flicker and the ghosts SHALL not drift.
6. ALL text SHALL meet the WCAG AA contrast tokens checked by the token test.

### Requirement 8: Privacy, tests and delivery

**User Story:** As the project owner, I want the game to keep every promise, so that the app stays trustworthy.

#### Acceptance Criteria

1. THE Game SHALL keep scores and answers in memory only, and SHALL store or send nothing.
2. THE Test_Suite SHALL include property tests that a Game always has 10 unique Rounds, that the score is always 0 to 10, that every Scam_Sample is checked as suspicious or likely scam, and that no Genuine_Sample gets a high-severity flag.
3. THE Test_Suite SHALL include component tests for a full game, wrong answers, the End_Screen and keyboard play.
4. THE mobile performance script SHALL also measure Séance in Haunted view.
5. WHEN `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` run, THE Project SHALL pass all four.
6. WHEN the work is complete, THE agent SHALL update the README and journal, create one commit and push `main`.