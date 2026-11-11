---
inclusion: always
---

# Security and privacy

## No backend, no network

- Phantom Inbox has no backend. It is a set of static files.
- No network request carries message content. That includes the request URL, headers and body.
- Runtime code makes zero network calls. Do not use `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` or `navigator.sendBeacon`.

## Storage

- Message content is never written to localStorage, sessionStorage, IndexedDB, cookies, URLs, or console and application logs.
- The only values stored in the browser are the view preference (`phantom-inbox:view`, value `mortal` or `haunted`) and the reduced-motion preference (`phantom-inbox:reduced-motion`, value `true` or `false`).
- If storage fails or is blocked, the app keeps working with defaults and shows no error.
- Séance answers and scores live in memory only. They are never stored or sent, and they are gone when the page closes.

## Screenshots

- Screenshots are read in the browser. The image is passed to the reader as a Blob and never sent anywhere.
- The OCR worker, engine and language data are served from this site's `ocr/` folder. No CDN is used.
- The worker starts from a same-origin URL, so the policy needs no `blob:` source.
- The reader's language cache is off (`cacheMethod: 'none'`), so nothing is written to IndexedDB.
- Family warnings are built from fixed templates only. They never include words, links or numbers from the checked message.
## No tracking

- No analytics, no tracking and no third-party scripts are used.
- No fonts, images or scripts load from another origin.

## Content-Security-Policy

The production build includes this policy in a `<meta http-equiv="Content-Security-Policy">` tag. It contains `connect-src 'none'` and `script-src 'self'`, and it allows no `unsafe-inline` or `unsafe-eval`.

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'
```

- The policy applies to the production build only. The Vite development server is exempt, because it needs inline scripts and a websocket for hot module replacement, so `npm run dev` keeps working.
- The single source of the policy text is `csp.ts`. This document and `dist/index.html` must match it exactly.

## Untrusted message text

- Message text comes from strangers. Treat it as untrusted.
- Render it as plain text. Never use `innerHTML` or `dangerouslySetInnerHTML` with message content.
- Never turn message text into a link that the app opens for the user.

## Wording

- No user-facing text claims 100% certainty.
- Results are worded as likelihood or risk level, not as a guarantee that a message is safe or a scam.