# Requirements Document

## Introduction

Haunted view is the Costume Contest showpiece of Phantom Inbox. It turns the Possession Check screen into a dark haunted mansion where every red flag becomes a ghost attached to the exact words it is about. Each effect has a job: it points at the trick and makes the reason easier to see. Lookalike letters twitch, pressure words bleed, fake deadlines get a mocking countdown, link ghosts speak the link's "True Name", and the haunt score is a candle that burns down. Everything is drawn with CSS and SVG, works offline, honours reduced motion, and keeps WCAG 2.1 AA contrast. Mortal view stays calm and unchanged.

## Glossary

- **Shell**: the app frame in `src/App.tsx` with the header, the view toggle and the reduced-motion toggle.
- **Haunted_View**: the view active when the root element has `data-view="haunted"`.
- **Mortal_View**: the calm, high-contrast view with `data-view="mortal"`.
- **Backdrop**: the decorative mansion scene behind the content: night sky, moon, mansion silhouette, lit windows, bats and drifting fog.
- **Panel**: any opaque content surface (header plaque, Possession Check panel, result panel, flag cards).
- **Ghost**: the interactive marker for one red flag, placed right after the flag's exact words in the checked text.
- **Ghost_Mark**: the highlighted words of a red flag in Haunted_View.
- **Lookalike_Part**: a character or character pair inside a flagged web address or sender domain that imitates a brand letter, such as the `1` in `paypa1` or `rn` in `arnazon`.
- **Deadline_Flag**: an `urgency` flag whose words state a deadline, such as "within 24 hours" or "today itself".
- **Link_Flag**: a flag of type `lookalike-domain` (in the message), `link-text-mismatch`, `url-shortener`, `ip-link` or `risky-tld`.
- **True_Name**: the real destination of a Link_Flag, with its suspicious part marked.
- **Whisper**: the in-text panel that a Ghost opens to show its plain-English reason.
- **Score_Candle**: the SVG candle that shows the haunt score in Haunted_View.
- **Reduced_Motion_Mode**: active when the system reports `prefers-reduced-motion: reduce` or the manual setting is on.
- **Heading_Font**: the Creepster typeface, bundled from `@fontsource/creepster` under the SIL Open Font License.

## Requirements

### Requirement 1: View toggle that is remembered

**User Story:** As a returning user, I want my chosen view to stay chosen, so that I do not have to switch every visit.

#### Acceptance Criteria

1. THE Shell SHALL provide one switch that toggles between Mortal_View and Haunted_View, operable with Tab, Enter and Space, exposing its state with `role="switch"` and `aria-checked`.
2. WHEN the user changes the view, THE Shell SHALL store `mortal` or `haunted` under `phantom-inbox:view` and SHALL show the same view after a reload.
3. WHEN no valid stored view exists, THE Shell SHALL start in Mortal_View.
4. WHEN the view changes, THE Shell SHALL keep the message, any loaded email details and the current result.

### Requirement 2: Haunted mansion look

**User Story:** As a contest visitor, I want Haunted view to feel like a real haunted mansion, so that the experience is memorable.

#### Acceptance Criteria

1. WHILE Haunted_View is active, THE Shell SHALL show the Backdrop: a night-sky gradient with stars, a moon, a mansion silhouette with lit windows, flying bats and at least two layers of drifting fog.
2. THE Backdrop SHALL be hidden from assistive technology, SHALL ignore pointer events and SHALL sit behind every Panel.
3. WHILE Haunted_View is active, THE Shell SHALL draw every Panel as a candle-lit card with an opaque surface, a warm glow and a small candle flame, and the glow SHALL flicker.
4. WHILE Haunted_View is active, THE Shell SHALL use the Heading_Font for `h1`, `h2` and `h3` only, and body text, labels, reasons, ghost labels and the verdict SHALL keep the readable body font.
5. THE Heading_Font SHALL be served from the same origin as the app, SHALL load only when Haunted_View uses it, and SHALL use `font-display: swap`.
6. WHILE Mortal_View is active, THE Shell SHALL NOT render the Backdrop, ghosts or candle, and SHALL look as it did before this feature.

### Requirement 3: Ghosts on the exact words

**User Story:** As a user, I want each red flag to appear as a ghost on the words it is about, so that I can see exactly where the trick is.

#### Acceptance Criteria

1. WHEN a result is shown in Haunted_View, THE Screen SHALL render each red flag's exact span in the message, email details or attachment name as a Ghost_Mark, and SHALL place that flag's Ghost directly after the span.
2. EACH Ghost SHALL show a ghost drawing, the flag number and a visible text label of 1 to 40 characters naming the red flag type.
3. EACH Ghost SHALL be a button with an accessible name that contains its visible label and the words "Red flag" and the flag number.
4. EACH Ghost button SHALL be at least 44px high and 44px wide, and SHALL show a visible focus indicator of at least 2px.
5. WHERE spans overlap, THE Screen SHALL keep one Ghost per flag and SHALL mark every covered character.
6. THE Screen SHALL render all message text as plain text and SHALL NOT turn message text into a link.

### Requirement 4: Effects that point at the trick

**User Story:** As a user, I want each kind of trick to look different, so that I learn to recognise it.

#### Acceptance Criteria

1. WHEN a `lookalike-domain` flag is shown, THE Screen SHALL wrap each Lookalike_Part in its own element that glows, carries a visible outline and twitches, so the `1` in `paypa1` stands out from the real letters.
2. THE Engine SHALL export `lookalikeParts(host)`, which returns the ranges of the Lookalike_Parts inside a host, and SHALL return no ranges for a host that uses a brand name without look-alike characters.
3. WHEN an `urgency` or `threat` flag is shown, THE Ghost_Mark SHALL slowly bleed: red drops SHALL form under the words and fall, without covering the flagged words.
4. WHEN a Deadline_Flag is shown, ITS Ghost SHALL show a small countdown that starts at the stated deadline (or at the time left until midnight for "today itself" and "tonight") and counts down once per second.
5. WHEN the countdown reaches zero, THE Ghost SHALL say that nothing happened, to show the deadline was fake.
6. WHEN any other flag is shown, THE Ghost_Mark SHALL show a soft haunting glow.

### Requirement 5: Link ghosts speak their True Name

**User Story:** As a user, I want to see where a link really goes without opening it, so that I am not fooled by what it shows.

#### Acceptance Criteria

1. THE Engine SHALL add a `destination` field with the real link address to every Link_Flag found in the message.
2. WHEN the pointer hovers a Link_Flag's Ghost_Mark or Ghost, or the Ghost receives keyboard focus, THE Ghost SHALL show a speech bubble with "True Name:" and the True_Name.
3. THE True_Name SHALL mark its suspicious part in bold with an underline: the look-alike letters, the risky ending, the raw IP address, the shortener, or the real site behind mismatched link text.
4. FOR a `url-shortener` flag, THE speech bubble SHALL say that the real destination stays hidden because Phantom Inbox never opens links.
5. THE speech bubble SHALL be linked to its Ghost with `aria-describedby`, SHALL stay visible while the pointer is over it, and SHALL close when the user presses Escape.

### Requirement 6: Ghosts reveal their reason

**User Story:** As a user, I want to tap a ghost to hear why it is there, so that I understand the warning.

#### Acceptance Criteria

1. WHEN a Ghost is activated, THE Ghost SHALL open its Whisper in the text flow directly after it, and SHALL set `aria-expanded="true"`.
2. THE Whisper SHALL show the flag label, the severity in words, the one-line reason, the True_Name for Link_Flags, and a link to the matching flag card.
3. WHEN the Ghost is activated again, or Escape is pressed while it has focus, THE Whisper SHALL close and focus SHALL stay on the Ghost.
4. THE Whisper SHALL never cover other text, because it opens inside the text flow.

### Requirement 7: Score candle

**User Story:** As a user, I want the haunt score shown as a candle, so that a high score feels like danger at a glance.

#### Acceptance Criteria

1. WHILE Haunted_View is active, THE Result_Panel SHALL show the Score_Candle next to the haunt score text, with a short caption explaining that the candle burns down as the score rises.
2. THE Score_Candle wax height SHALL never increase when the score increases, SHALL be full at score 0, and SHALL keep a small stub with a flame at score 99.
3. WHEN a result appears, THE Score_Candle SHALL melt from a full candle down to its final height, and its flame SHALL flicker.
4. THE Score_Candle SHALL be hidden from assistive technology, and THE `<meter>` SHALL remain available to assistive technology in Haunted_View.

### Requirement 8: Motion, contrast and safety

**User Story:** As a user who is sensitive to motion or has low vision, I want the haunting to stay safe and readable, so that I can use Haunted view too.

#### Acceptance Criteria

1. WHILE Reduced_Motion_Mode is active, THE Shell SHALL stop fog drift, flicker, twitching, bleeding, ghost bobbing, bats, the countdown ticking and the candle melt, and SHALL show a static version of each effect.
2. THE Shell SHALL draw every text element in Haunted_View on an opaque Panel or mark background, so that fog and the Backdrop never sit behind text.
3. THE contrast of text on every Panel, including the candle glow at its strongest, SHALL be at least 4.5:1, and ghosts, verdict colours and focus indicators SHALL have at least 3:1 against what is next to them.
4. NO effect SHALL flash more than three times in any one second, and flicker SHALL change only the brightness of a soft glow.
5. CONTINUOUS animations SHALL change only `transform` and `opacity`, so the browser can run them without repainting the page.
6. WHEN axe-core runs in Haunted_View before a check, after a check, and with a Whisper open, THE Test_Suite SHALL report no WCAG A or AA violations.

### Requirement 9: Free assets only

**User Story:** As the project owner, I want only free assets, so that the contest entry is safe to publish.

#### Acceptance Criteria

1. THE Project SHALL use no copyrighted images or sounds, and SHALL draw the Backdrop, ghosts, candle and icons with CSS and inline SVG written for this project.
2. THE Project SHALL bundle the Heading_Font from an npm package under the SIL Open Font License and SHALL load no asset from another origin.
3. THE README SHALL list every third-party asset with its source and licence.

### Requirement 10: Mobile performance and delivery

**User Story:** As a phone user, I want Haunted view to stay smooth, so that the effects do not make the app slow.

#### Acceptance Criteria

1. THE Project SHALL include `scripts/perf-mobile.mjs`, which serves the production build locally, opens it in an installed Chromium browser with a phone viewport and 4x CPU slowdown, and records load timings, frame rate during the haunted result, long tasks, layout shift and every request origin.
2. WHEN the script runs with reduced motion requested, IT SHALL record that no CSS animations are running.
3. WHEN the script runs, IT SHALL write its results to `docs/perf-mobile.md`.
4. WHEN `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` run, THE Project SHALL pass all four.
5. WHEN the work is complete, THE agent SHALL append one entry to `docs/kiro-journal.md` and create one commit.