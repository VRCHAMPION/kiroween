# Requirements Document

## Introduction

This spec adds two things to Phantom Inbox.

**Screenshots.** Most scam messages that elders receive arrive on SMS or WhatsApp, where there is no file to save. The user can upload or paste a screenshot of the chat instead. The browser reads the words with OCR (optical character recognition), shows the text so the user can fix mistakes, and only then runs the check. The OCR engine is loaded only when a screenshot is used, from the same site, and keeps nothing.

**Exorcism.** After a check that finds a likely scam or a suspicious message, Phantom Inbox says what to do next in plain words. The steps change with the red flags found. A ready-to-copy warning for family is given in simple English and in Hindi. In Haunted view the steps are shown as an exorcism ritual where the ghosts fade as each step is read, while the steps themselves stay just as clear.

## Glossary

- **Screen**: the Possession Check feature in `src/features/possession-check/`.
- **OCR_Reader**: the module in `src/ocr/` that turns a screenshot into text with tesseract.js.
- **OCR_Assets**: the tesseract worker script, the WebAssembly core builds and the English language data, served from the app's own origin under `ocr/`.
- **Screenshot_Picker**: the "Choose a screenshot" button, its drop zone and the paste handling.
- **Reading_State**: the progress display shown while the OCR_Reader works.
- **Exorcism**: the "What to do now" section in `src/features/exorcism/`, shown inside the result.
- **Plan**: the list of next steps and the family warnings that `exorcismPlan(result)` returns.
- **Base_Steps**: the five steps every Plan has: do not reply, do not click or open, never share codes or pay, block the sender, report at cybercrime.gov.in or by calling 1930.
- **Flag_Steps**: extra steps added because of specific red flag types.
- **Family_Warning**: the copyable warning message, in English and in Hindi.
- **Ritual**: the Haunted view presentation of the Exorcism, with a ghost circle and a "read" control per step.

## Requirements

### Requirement 1: Add a screenshot

**User Story:** As an elderly user who got a scam on WhatsApp, I want to give the app a screenshot, so that I do not have to type the message.

#### Acceptance Criteria

1. THE Screen SHALL show a "Choose a screenshot" button that opens the system picker for images, and a drop zone that accepts a dropped image.
2. WHEN the user pastes an image (for example with Ctrl+V or a long-press paste) anywhere in the Screen, THE Screen SHALL read that image as a screenshot, and pasting plain text SHALL keep working as before.
3. THE Screen SHALL accept PNG, JPEG, WebP, GIF and BMP images up to 10 MB.
4. IF the file is not one of those image types, or is larger than 10 MB, THEN THE Screen SHALL show a plain-language alert and SHALL keep the current message unchanged.
5. THE Screen SHALL show a small preview of the screenshot with the alternative text "Your screenshot", using a `data:` URL so the Content-Security-Policy needs no change.

### Requirement 2: Read the text in the browser

**User Story:** As a user, I want the words read on my own phone, so that my private chat is never sent anywhere.

#### Acceptance Criteria

1. THE OCR_Reader SHALL load tesseract.js with a dynamic import only when the user first adds a screenshot, so the first page load does not include it.
2. THE OCR_Reader SHALL load the worker script, the WebAssembly core and the English language data from the app's own origin under `ocr/`, and SHALL NOT use any CDN.
3. THE OCR_Reader SHALL start the worker from a same-origin script URL (`workerBlobURL: false`), so the Content-Security-Policy does not need `blob:`.
4. THE OCR_Reader SHALL turn off tesseract's language-data cache (`cacheMethod: 'none'`), so nothing is written to IndexedDB or any other storage.
5. THE OCR_Reader SHALL pass the image to tesseract as a `Blob`, never as a URL, so no `fetch` is made for the image.
6. BEFORE recognition, THE OCR_Reader SHALL prepare the image in the browser: enlarge small screenshots, turn them grey, and invert dark-mode screenshots so the text is dark on light.
7. WHEN recognition finishes or fails, THE OCR_Reader SHALL end the worker so its memory is freed.
8. THE build SHALL copy the OCR_Assets from the installed npm packages into `dist/ocr/`, and the development server SHALL serve the same paths.

### Requirement 3: Friendly progress while reading

**User Story:** As an elderly user, I want to see that the app is working, so that I wait instead of giving up.

#### Acceptance Criteria

1. WHILE the OCR_Reader works, THE Screen SHALL show the Reading_State with a progress bar, a percentage and a friendly line that changes with the stage: getting the reader ready, learning to read English, reading the words.
2. THE Reading_State SHALL announce each new stage once to screen readers through a `role="status"` region, and SHALL NOT announce every percentage change.
3. THE Reading_State SHALL offer a "Stop reading" button that cancels the work and returns the Screen to how it was.
4. WHILE reading, THE Screen SHALL disable the "Check this message" button and the screenshot button, so a half-read message cannot be checked.
5. IN Haunted view, THE Reading_State SHALL show a ghost reading the screenshot with the line "The spirits are reading your screenshot", and its motion SHALL stop in reduced-motion mode.

### Requirement 4: Fix the text, then check

**User Story:** As a user, I want to see and correct what was read, so that OCR mistakes do not change the result.

#### Acceptance Criteria

1. WHEN reading finishes, THE Screen SHALL put the cleaned text into the message box, move focus to it, and say "We read this text from your screenshot. Please compare it with the screenshot and fix any mistakes, then press Check this message."
2. THE Screen SHALL NOT run the check automatically after reading.
3. THE OCR_Reader SHALL clean the text by trimming each line, joining runs of spaces, and keeping at most one empty line in a row.
4. IF no words are found, THEN THE Screen SHALL say so in an alert and suggest a clearer screenshot or typing the message.
5. IF the OCR_Reader cannot start or fails, THEN THE Screen SHALL show an alert saying the screenshot could not be read and that the message can still be typed or pasted.

### Requirement 5: Next steps after a scam

**User Story:** As a frightened user, I want clear steps, so that I know exactly what to do now.

#### Acceptance Criteria

1. WHEN a check gives the verdict "likely scam" or "suspicious", THE result SHALL show the Exorcism, titled "What to do now", directly after the verdict and score.
2. WHEN a check gives "looks safe", THE result SHALL NOT show the Exorcism.
3. EVERY Plan SHALL include the Base_Steps, each as a short instruction in plain words followed by one sentence of explanation.
4. THE "report" step SHALL give the National Cyber Crime Reporting Portal as a link to `https://cybercrime.gov.in` and the helpline 1930 as a `tel:1930` link.
5. THE Exorcism SHALL be an ordered list with a heading, so screen readers announce how many steps there are.
6. THE intro SHALL match the verdict ("This message is likely a scam." or "This message might be a scam."), and no step SHALL claim certainty.

### Requirement 6: Steps that follow the red flags

**User Story:** As a user, I want advice about the trick in my message, so that I can undo any harm already done.

#### Acceptance Criteria

1. WHEN a `remote-access-app` flag is found, THE Plan SHALL start with a step to uninstall the screen-sharing app and call the bank on the number printed on the card.
2. WHEN a `sensitive-info-request`, `upi-refund` or `payment-request` flag is found, THE Plan SHALL include, near the top, a step for anyone who already shared a code or paid: call the bank to block the account or card, and call 1930 at once.
3. WHEN a `risky-attachment` flag is found, THE Plan SHALL include a step not to open or install the file, and what to do if it was installed.
4. WHEN a link or lookalike flag is found, THE Plan SHALL include a step to change any password typed on that site, using the real app or website.
5. WHEN a `kyc-expiry`, `courier-fee`, `electricity-disconnection`, `job-task-scam`, `digital-arrest` or `email-auth-fail` flag is found, THE Plan SHALL include a step about that trick, such as "Police never arrest anyone on a video call".
6. WHEN an `urgency` or `threat` flag is found, THE Plan SHALL include a step to take time, because real organisations give you time.
7. THE Plan SHALL contain no step for a flag type that was not found, and SHALL list each step once.

### Requirement 7: Warning for family

**User Story:** As a user, I want a ready message to warn my family, so that they do not fall for the same scam.

#### Acceptance Criteria

1. THE Exorcism SHALL show a Family_Warning in simple English and in Hindi, each with its own "Copy" button.
2. THE Family_Warning SHALL name the kind of scam found, say not to click links, not to share OTP or PIN and not to pay, and say to block the number and report it at cybercrime.gov.in or by calling 1930.
3. THE Family_Warning SHALL be built only from fixed templates and SHALL NOT include any words, links or numbers from the checked message.
4. THE Hindi warning SHALL be marked `lang="hi"` so screen readers pronounce it correctly.
5. WHEN a Copy button is pressed, THE Exorcism SHALL copy the text to the clipboard and announce "Copied" in a status region, and IF copying fails, THEN it SHALL select the text and ask the user to copy it.
6. WHERE the device supports the share sheet, THE Exorcism SHALL also show a "Share" button for each warning.

### Requirement 8: The exorcism ritual in Haunted view

**User Story:** As a contest visitor, I want the next steps to feel like banishing the ghosts, so that finishing them feels rewarding.

#### Acceptance Criteria

1. IN Haunted view, THE Exorcism SHALL be titled "The Exorcism" with the subtitle "What to do now", and SHALL show a circle with one ghost per red flag.
2. IN Haunted view, EACH step SHALL have a checkbox labelled "I have read this step", and the step text SHALL stay exactly as in Mortal view.
3. WHEN steps are marked read, THE ghosts SHALL fade away one by one in proportion, so the number of banished ghosts never goes down as more steps are read, is 0 when none are read, and is all of them when every step is read.
4. THE Ritual SHALL announce its progress ("3 of 7 steps read. 2 of 5 ghosts banished.") in a status region, and SHALL show "The ghosts are banished. Stay safe." when every step is read.
5. THE ghost circle SHALL be hidden from assistive technology, and fading SHALL use only opacity and transform, with no animation in reduced-motion mode.
6. IN Mortal view, THE steps SHALL be a plain numbered list with no checkboxes and no ghosts.

### Requirement 9: Privacy, assets and delivery

**User Story:** As the project owner, I want this feature to keep every promise, so that the app stays trustworthy.

#### Acceptance Criteria

1. THE Project SHALL make no request to another origin when reading a screenshot, and SHALL store nothing new in the browser.
2. THE README SHALL list tesseract.js and tesseract.js-core (Apache-2.0) and the English language data with their licences, and the licence texts SHALL ship in `public/licenses/`.
3. THE Project SHALL include `scripts/ocr-check.mjs`, which reads a generated chat screenshot in an installed Chromium browser using the production build with its Content-Security-Policy, and records the text read, request origins, storage used and any CSP violations in `docs/ocr-check.md`.
4. WHEN `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` run, THE Project SHALL pass all four.
5. WHEN the work is complete, THE agent SHALL append one entry to `docs/kiro-journal.md` and create one commit.