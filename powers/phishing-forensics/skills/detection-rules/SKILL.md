---
name: detection-rules
description: What each Phantom Inbox detection rule does, how domains are judged (registrable domain, homographs, typosquats), and the wording rules for results
---

# Detection rules

The engine lives in `src/detection/` and has no UI code. `analyse(input)` is synchronous and returns a risk level (`looks safe`, `suspicious`, `likely scam`), a score and red flags. Results are worded as likelihood, never as certainty.

## Rule files (one file and one `<rule>.test.ts` each, in `src/detection/rules/`)

- `courier-fee.ts`: parcel held until a small fee is paid.
- `digital-arrest.ts`: claims you are under arrest and must pay or stay on a video call.
- `electricity-disconnection.ts`: power will be cut tonight unless you pay or call.
- `email-auth-fail.ts`: email headers show failed sender checks.
- `ip-link.ts`: link to a raw IP address.
- `job-task-scam.ts`: easy money for liking videos or small tasks.
- `kyc-expiry.ts`: account blocked unless KYC is updated.
- `link-text-mismatch.ts`: visible link text names a different site from where the link goes.
- `lookalike-domain.ts`: web address or sender that imitates a brand (see below).
- `payment-request.ts`: unusual payment request.
- `remote-access-app.ts`: asks you to install a remote access app.
- `risky-attachment.ts`: dangerous attachment type.
- `risky-tld.ts`: web address ending often used by scam sites.
- `sensitive-info-request.ts`: asks for PIN, OTP, password or similar.
- `upi-refund.ts`: a "refund" that needs you to approve a payment request.
- `urgency-threats.ts`: pressure to act fast, threats.
- `url-shortener.ts`: shortened link hides the destination.

## Domain logic (`lookalike-domain.ts` uses `brands.ts`)

- Always judge the registrable domain from `parseDomain` (`domain.ts`, tldts and the Public Suffix List). `paypal.com.secure-login.xyz` is `secure-login.xyz`.
- Kinds: `brand` (curated India-focused brands), `homograph` (look-alike letters copying a famous site), `brand-in-subdomain`, `typosquat` (small spelling change, distance 1 or 2 with length gates in `typosquat.ts`), `foreign-script` (two alphabets in one name, or an `xn--` name that cannot be decoded).
- A brand's own registrable domain is never flagged. Comparison is on the skeleton (`skeleton.ts`) of the decoded name; `punycode.ts` decodes `xn--` labels and the decoded host is shown as plain text, never a link.
- No new rule ID is added for these kinds; they use the existing `lookalike-domain` type.

## Data (lazy `detection-data` chunk, `src/detection/data/`)

- `confusables.ts`: from Unicode `confusables.txt` (Unicode License v3). Regenerate with `npm run gen:confusables`.
- `top-brands.ts`: top 1,000 of the Majestic Million (CC BY 3.0). Regenerate with `npm run gen:brands`.
- Load with `ensureDetectionData()`; before it resolves the engine uses curated brands and a small suffix table (pre-load mode).

## Wording rules

No 100% certainty claims. Every flag has a label of 1 to 40 characters and a one-line plain-English reason. Message text is untrusted: render as plain text only.