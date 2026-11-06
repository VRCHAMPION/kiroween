# Requirements Document

## Introduction

The detection engine is the pure TypeScript core of Phantom Inbox. It reads a message (text plus optional email headers and attachment names) and returns a haunt score from 0 to 100, a verdict, and a list of red flags. Each red flag points at the exact words it is about, so the UI can place a ghost or a highlight on them. The engine has no UI code, makes no network calls, and stores nothing. It ships with 15 sample messages that later power the "Try a sample" menu.

## Glossary

- **Engine**: the code under `src/detection/`, with entry point `analyse(input)`.
- **Analysis_Input**: `{ text: string; headers?: Record<string, string> | string; attachments?: string[] }`.
- **Analysis_Result**: `{ score, verdict, flags, headerText }`.
- **Red_Flag**: one finding, with `type`, `label`, `severity`, `reason`, `source`, `start`, `end` and `text`.
- **Span**: the half-open range `[start, end)` of UTF-16 offsets into the flag's source string.
- **Source**: `body` (the message text), `header` (the `headerText` string in the result) or `attachment` (one attachment name, identified by `attachmentIndex`).
- **Haunt_Score**: an integer from 0 to 100 that grows with the number and severity of red flags.
- **Verdict**: one of `likely scam`, `suspicious`, `looks safe`.
- **Rule**: one file in `src/detection/rules/` that returns Red_Flags for a prepared input.
- **Normaliser**: `normaliseConfusables`, which folds look-alike characters to plain ASCII letters for comparison.
- **Sample_Set**: the 15 sample messages in `src/data/samples.ts`.

## Requirements

### Requirement 1: Analysis entry point

**User Story:** As a UI developer, I want one pure function that analyses a message, so that every screen gets the same answer for the same message.

#### Acceptance Criteria

1. THE Engine SHALL export `analyse(input: Analysis_Input): Analysis_Result`.
2. THE Engine SHALL accept headers either as a name-to-value record or as raw header text, and attachments as a list of file names.
3. THE Engine SHALL return the same Analysis_Result for the same Analysis_Input on every call, without reading the clock, random numbers, storage or the network.
4. THE Engine SHALL contain no UI code and SHALL NOT be imported by the foundation app shell files.
5. THE Engine SHALL return `headerText`, the header string that header spans point into.

### Requirement 2: Red flag shape

**User Story:** As a user, I want each warning to point at the exact words and explain itself in plain English, so that I can see and understand the trick.

#### Acceptance Criteria

1. THE Red_Flag SHALL contain a `type`, a `label` of 1 to 40 characters, a `severity` of `low`, `medium` or `high`, and a one-line `reason`.
2. THE Red_Flag SHALL contain a Span and a `text` field, and `text` SHALL equal the Source string sliced from `start` to `end`.
3. WHEN a Red_Flag comes from the message body, THE Span SHALL index into `input.text`, so that `input.text.slice(start, end)` returns the flagged words.
4. THE `reason` SHALL be a single line and SHALL NOT claim certainty (no "100%", "definitely", "guaranteed" or "certain").
5. THE Engine SHALL return flags sorted by source (body, header, attachment), then attachment index, then start offset.

### Requirement 3: Haunt score and verdict

**User Story:** As a user, I want one simple score and verdict, so that I know at a glance how worried to be.

#### Acceptance Criteria

1. THE Haunt_Score SHALL be an integer from 0 to 100 for every input.
2. WHEN a Red_Flag is added to a list of flags, THE Haunt_Score of the longer list SHALL be greater than or equal to the Haunt_Score of the shorter list.
3. THE Verdict SHALL be `likely scam` WHEN the Haunt_Score is 60 or more, `suspicious` WHEN it is 25 to 59, and `looks safe` WHEN it is below 25.
4. WHEN the text is empty or whitespace only and there are no headers and no attachments, THE Engine SHALL return Haunt_Score 0, Verdict `looks safe` and no flags.
5. THE Haunt_Score SHALL count only the strongest flag of each type, so that repeating one trick does not inflate the score.
6. THE Haunt_Score SHALL never exceed 99, so that it never reads as 100% certainty.

### Requirement 4: Link and sender rules

**User Story:** As a user, I want fake web addresses and senders called out, so that I do not open a fake website.

#### Acceptance Criteria

1. WHEN a link host or sender domain imitates a known brand, including digit swaps (paypa1), "rn" for "m" and Cyrillic or Greek look-alike letters, THE Engine SHALL flag it as `lookalike-domain` on the host or domain.
2. WHEN the visible text of a link shows one web address but the link goes to a different site, THE Engine SHALL flag the visible text as `link-text-mismatch`.
3. WHEN a link uses a URL shortener, THE Engine SHALL flag it as `url-shortener`.
4. WHEN a link points to a raw IP address, THE Engine SHALL flag it as `ip-link`.
5. WHEN a link uses a top-level domain often abused by scammers, THE Engine SHALL flag it as `risky-tld`.
6. WHEN the headers report an SPF, DKIM or DMARC failure, THE Engine SHALL flag each failure as `email-auth-fail` on the failing result in `headerText`.
7. THE Engine SHALL NOT flag a host whose registrable domain is the brand's official domain.

### Requirement 5: Language rules

**User Story:** As a user, I want pressure tactics and requests for secrets called out, so that I slow down before acting.

#### Acceptance Criteria

1. WHEN the text uses urgency such as "within 24 hours", "immediately" or "today itself", THE Engine SHALL flag it as `urgency`.
2. WHEN the text threatens the user, such as an account being blocked, a police case or an arrest, THE Engine SHALL flag it as `threat`.
3. WHEN the text asks the user to share or enter an OTP, PIN, password or card details, THE Engine SHALL flag it as `sensitive-info-request`.
4. WHEN the text mentions a remote-access app such as AnyDesk or TeamViewer, THE Engine SHALL flag it as `remote-access-app`.
5. WHEN the text asks the user to approve a UPI collect request or to buy gift cards, THE Engine SHALL flag it as `payment-request`.
6. IF the same sentence negates the request (for example "Never share your OTP"), THEN THE Engine SHALL NOT flag it under criteria 3, 4 or 5.

### Requirement 6: India scam patterns

**User Story:** As a user in India, I want the common local scams recognised, so that the warnings match what I actually receive.

#### Acceptance Criteria

1. WHEN the text says a KYC has expired, is pending or must be updated, THE Engine SHALL flag it as `kyc-expiry`.
2. WHEN the text says a parcel is held or asks for a customs, redelivery or delivery fee, THE Engine SHALL flag it as `courier-fee`.
3. WHEN the text threatens to disconnect electricity or says a bill was not updated, THE Engine SHALL flag it as `electricity-disconnection`.
4. WHEN the text ties a refund to a UPI app, a PIN, a QR code or a collect approval, THE Engine SHALL flag it as `upi-refund`.
5. WHEN the text offers easy money for tasks, part-time work from home or daily earnings, THE Engine SHALL flag it as `job-task-scam`.
6. WHEN the text claims a "digital arrest", an agency investigation by video call, or a drugs parcel in the user's name, THE Engine SHALL flag it as `digital-arrest`.

### Requirement 7: Attachment rules

**User Story:** As a user, I want dangerous files called out, so that I do not install malware.

#### Acceptance Criteria

1. WHEN an attachment name ends in `.apk`, `.exe`, `.scr` or another executable extension, THE Engine SHALL flag the attachment name as `risky-attachment` with severity `high`.
2. WHEN an attachment name ends in `.html` or `.htm`, THE Engine SHALL flag it as `risky-attachment` with severity `high`.
3. WHEN an attachment name ends in a macro-enabled Office extension (`.docm`, `.xlsm`, `.pptm` and similar), THE Engine SHALL flag it as `risky-attachment` with severity `high`.
4. WHEN the message body names an `.apk`, `.exe`, `.scr` or macro document file, THE Engine SHALL flag the file name in the body as `risky-attachment`.

### Requirement 8: Homoglyph normalisation

**User Story:** As a developer, I want one trustworthy normaliser, so that every rule compares look-alike text the same way.

#### Acceptance Criteria

1. THE Normaliser SHALL apply Unicode NFKC, lower-case the text, map Cyrillic and Greek look-alike letters and the digits 0, 1, 3 and 5 to Latin letters, and replace "rn" with "m" and "vv" with "w".
2. THE Normaliser SHALL be idempotent: normalising a normalised string SHALL return the same string.

### Requirement 9: Sample messages

**User Story:** As a user, I want realistic examples to try, so that I can learn what scams look like.

#### Acceptance Criteria

1. THE Sample_Set SHALL contain exactly 15 messages: 10 scams and 5 genuine messages, including a genuine bank alert and a genuine delivery update.
2. THE Sample_Set SHALL use only made-up names, phone numbers and domains for every sender, link and person.
3. THE scams in the Sample_Set SHALL together trigger every Red_Flag type.
4. EACH sample SHALL record its channel (email, SMS or WhatsApp), a title, its expected Verdict and the flag types it is expected to trigger.
5. WHEN each sample is analysed, THE Engine SHALL return the sample's expected Verdict.

### Requirement 10: Tests and delivery

**User Story:** As a developer, I want every rule and property tested, so that the engine stays trustworthy as rules change.

#### Acceptance Criteria

1. EACH Rule SHALL have a co-located `<rule>.test.ts` with example tests for what it flags, what it must not flag, and the exact span.
2. THE Test_Suite SHALL include fast-check property tests with at least 100 runs for: score range, score monotonicity, normaliser idempotence and empty input.
3. WHEN `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` run, THE Project SHALL pass all four.
4. WHEN the work is complete, THE agent SHALL append one entry to `docs/kiro-journal.md` and create one commit.