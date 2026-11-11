# Requirements Document

## Introduction

Possession Check is the main screen of Phantom Inbox. A user pastes a message, opens an `.eml` email file, or picks a sample, then presses "Check this message". The screen runs the detection engine in the browser and shows a clear verdict with a colour-blind-safe icon, the haunt score, a card for each red flag with its reason, and the message itself with the exact flagged words highlighted. The screen is built mobile first in Mortal view (calm, high contrast, large text) and works fully with a keyboard and a screen reader. A short note tells the user that the message never leaves the device.

## Glossary

- **Screen**: the Possession Check feature in `src/features/possession-check/`, shown inside the app shell's `<main>`.
- **Engine**: `analyse()` from `src/detection/`.
- **Message_Box**: the large text area where the user pastes a message.
- **Eml_Picker**: the drop zone and the "Choose an .eml file" button.
- **Eml_Parser**: `parseEml(raw)` in `src/email/parse-eml.ts`, which returns headers, header text, subject, sender, body text, links and attachment names.
- **Email_Details**: the headers and attachment names loaded from an `.eml` file or an email sample.
- **Sample_Menu**: the "Try a sample" select menu listing every sample from `src/data/samples.ts`.
- **Check_Button**: the "Check this message" button.
- **Result_Panel**: the section that shows the verdict, haunt score, flag cards and the highlighted message.
- **Verdict_Icon**: a shape that differs per verdict (octagon for likely scam, triangle for suspicious, circle with a tick for looks safe).
- **Flag_Card**: one card per red flag, numbered, with label, severity in words, the flagged words and the reason.
- **Highlight**: a `<mark>` around flagged words plus a numbered reference to the matching Flag_Card.

## Requirements

### Requirement 1: Paste a message

**User Story:** As an elderly user, I want a big, clearly labelled box to paste a message into, so that I can check it without hunting for controls.

#### Acceptance Criteria

1. THE Screen SHALL show the Message_Box with the visible label "Paste the message you received" and a hint that email, SMS and WhatsApp messages are accepted.
2. THE Message_Box SHALL fill the width of the screen, show at least 8 lines, and use the body text size of the active view.
3. WHEN the user changes the text in the Message_Box after a check, THE Screen SHALL clear the previous result, so that a result never describes different text.
4. WHEN the user empties the Message_Box, THE Screen SHALL also remove any loaded Email_Details.

### Requirement 2: Open an .eml file

**User Story:** As a user who received a suspicious email, I want to drop or pick the saved email file, so that the sender details and attachments are checked too.

#### Acceptance Criteria

1. THE Eml_Picker SHALL provide a "Choose an .eml file" button that opens the system file picker and a drop zone that accepts a dropped file.
2. WHEN the user picks or drops a file named `*.eml` or of type `message/rfc822`, THE Screen SHALL read it in the browser, parse it with the Eml_Parser, put the body text into the Message_Box and load its Email_Details.
3. THE Eml_Parser SHALL unfold and decode headers (including RFC 2047 encoded words), read multipart bodies, decode base64 and quoted-printable parts, prefer the HTML part converted to text with links written as `text <url>`, fall back to the plain-text part, and collect attachment names from `Content-Disposition` and `Content-Type` parameters (including RFC 2231 names).
4. THE Screen SHALL show a summary of loaded Email_Details: sender, subject, the number of links found and the attachment names, with a "Remove email details" button.
5. IF the file is not an `.eml` file, is larger than 5 MB, or has no email header block, THEN THE Screen SHALL show a plain-language error in an alert and keep the current message unchanged.
6. THE Eml_Parser SHALL never insert file content into the page as HTML and SHALL NOT send the file anywhere.

### Requirement 3: Try a sample

**User Story:** As a learner, I want to try realistic examples, so that I can see what the warnings look like.

#### Acceptance Criteria

1. THE Sample_Menu SHALL have the visible label "Try a sample" and list every sample by channel and title.
2. WHEN the user picks a sample, THE Screen SHALL put the sample text into the Message_Box and load the sample's headers and attachments as Email_Details.
3. THE Sample_Menu SHALL be a native select control so it works with keyboard, touch and screen readers.

### Requirement 4: Check the message

**User Story:** As a user, I want one obvious button to run the check, so that I always know what to press.

#### Acceptance Criteria

1. THE Screen SHALL show the Check_Button with the text "Check this message".
2. WHEN the Check_Button is activated, THE Screen SHALL run the Engine on the Message_Box text and the loaded Email_Details and show the Result_Panel.
3. WHEN the Result_Panel appears, THE Screen SHALL move keyboard focus to the Result_Panel heading so screen reader users hear the result.
4. IF the Message_Box is empty and no Email_Details are loaded, THEN THE Screen SHALL show "Paste a message, choose a sample, or open an .eml file first." in an alert and SHALL NOT show a result.
5. THE Screen SHALL show, next to the Check_Button, a note saying the message never leaves the device and is not saved.

### Requirement 5: Show the verdict and score

**User Story:** As an elderly user, I want a clear answer with a shape I can recognise, so that I understand it even if I cannot tell colours apart.

#### Acceptance Criteria

1. THE Result_Panel SHALL show the verdict as text ("Likely scam", "Suspicious" or "Looks safe") next to its Verdict_Icon.
2. THE Verdict_Icon SHALL use a different shape for each verdict and SHALL be hidden from assistive technology, because the verdict text carries the meaning.
3. THE Result_Panel SHALL show the haunt score as text ("Haunt score: N out of 100") and as a `<meter>` with an accessible name.
4. THE Result_Panel SHALL show one line of advice for the verdict and a note that the check can be wrong and is never a guarantee.
5. THE verdict colours SHALL have at least 3:1 contrast against the background and surface in both views.

### Requirement 6: Show each red flag

**User Story:** As a user, I want each warning explained simply, so that I learn why the message is risky.

#### Acceptance Criteria

1. THE Result_Panel SHALL show one numbered Flag_Card per red flag, in the order returned by the Engine.
2. EACH Flag_Card SHALL show the flag label as a heading, the severity in words, the exact flagged words in quotes, where they were found (message, email details or attachment name) and the one-line reason.
3. WHEN there are no red flags, THE Result_Panel SHALL say that no warning signs were found and still show the note that no check is perfect.

### Requirement 7: Highlight the exact words

**User Story:** As a user, I want the risky words marked in the message itself, so that I can see the trick where it happens.

#### Acceptance Criteria

1. THE Result_Panel SHALL show the checked message text with each red flag's exact span wrapped in a Highlight.
2. WHERE spans overlap, THE Result_Panel SHALL split the text into segments so every character is marked when at least one flag covers it, and the text read in order equals the checked text.
3. EACH Highlight SHALL end with the matching Flag_Card number, announced to screen readers as "red flag N".
4. Highlights SHALL use an underline and the reference number as well as a background colour, so colour is not the only signal, and highlighted text SHALL keep at least 4.5:1 contrast.
5. WHEN header flags exist, THE Result_Panel SHALL show the email details text with those spans highlighted, and attachment flags SHALL highlight the attachment name.
6. THE Result_Panel SHALL render all message text as plain text, never as HTML.

### Requirement 8: Mobile, keyboard and screen reader support

**User Story:** As a user on a phone or using a screen reader, I want the whole screen to work for me, so that I can check messages on my own.

#### Acceptance Criteria

1. THE Screen SHALL use a single-column layout that works from 320px wide without horizontal scrolling, with controls at least 44px high.
2. THE Screen SHALL be fully operable with the keyboard alone, in a logical tab order, with a visible focus indicator on every control.
3. EVERY control SHALL have a visible label, and status and error messages SHALL be announced (`role="status"` or `role="alert"`).
4. THE Screen SHALL use only design tokens for colours and sizes and no inline style attributes.
5. WHEN axe-core runs on the Screen before and after a check in Mortal and Haunted views, THE Test_Suite SHALL report no WCAG A or AA violations.

### Requirement 9: Tests and delivery

**User Story:** As a developer, I want component tests for the screen, so that it stays accessible and correct.

#### Acceptance Criteria

1. THE Test_Suite SHALL include component tests with Testing Library for typing and checking, samples, `.eml` picking and dropping, error states, focus movement, highlights and axe checks.
2. THE Test_Suite SHALL include fast-check property tests for text segmentation and for `.eml` round trips.
3. WHEN `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` run, THE Project SHALL pass all four.
4. WHEN the work is complete, THE agent SHALL append one entry to `docs/kiro-journal.md` and create one commit.