# Phantom Inbox

Every scam has a ghost hiding in it. Phantom Inbox makes it visible.

Phantom Inbox is a scam detector for emails, SMS and WhatsApp messages. It focuses on scams that are common in India, such as KYC expiry, courier fees, electricity disconnection, UPI refunds, fake job offers and "digital arrest". It is built for non-technical adults, elderly parents and anyone learning to spot scams.

## Features

- **Possession Check** (available): paste a message, add a screenshot, pick a sample or open an .eml file, and see which words look like a scam and why.
- **Exorcism** (available): after a scam or suspicious result, get clear next steps and a ready-to-copy warning for family in English and Hindi.
- **Séance** (available): a 10-round training game where you decide whether each message is real or a scam, and learn why.

The app has two views. Mortal view is calm, high contrast and large text. Haunted view shows each red flag as a ghost sitting on the exact words it is about.

## Screenshots

Most scams reach elders on SMS or WhatsApp, where there is no file to save. Take a screenshot of the chat instead.

- Press "Choose a screenshot", drop the picture on the box, or paste it with Ctrl+V.
- The words are read on your own device with tesseract.js. The reader is loaded only the first time you add a screenshot, and it comes from this site, not from another server.
- You see the text that was read, so you can fix any mistakes. The check runs only when you press "Check this message".
- Nothing is stored: the reader's own cache is switched off.

## Exorcism: what to do now

After a check finds a likely scam or a suspicious message, Phantom Inbox lists what to do in plain words.

- Every time: do not reply, do not click links or open files, never share an OTP, PIN or password and do not pay, block the sender, and report it at [cybercrime.gov.in](https://cybercrime.gov.in) or by calling 1930.
- More steps depend on the trick found. For example, a remote-access app means "uninstall it now and call your bank", and a "digital arrest" message means "police never arrest anyone on a video call".
- A short warning for your family is ready to copy or share, in simple English and in Hindi. It is made only from fixed wording, so nothing from the scam message is copied into it.
- In Haunted view the steps become an exorcism ritual: tick each step as you read it and the ghosts fade away. The steps stay word for word the same.

## Séance: real or scam?

Open "Séance" at the top of the page to practise.

- Each game has 10 made-up messages (SMS, WhatsApp and email): about 6 scams and 4 real ones, shuffled every time, with no repeats. The pool has 29 messages covering KYC, courier fees, electricity, UPI refunds, job tasks, digital arrest, lookalike links and risky attachments, plus real bank alerts, deliveries, one-time codes, bills and family messages.
- After each answer the real detection engine checks the message:
  - Right answer: "Well spotted!" and the main red flags.
  - Missed scam: the warning signs are marked on the exact words, with their plain-English reasons.
  - Real message marked as a scam: a calm explanation of why it was safe, so you do not learn to fear every message.
- The end screen shows your score out of 10, the scam types to look out for (with a tip for each), and "Play again".
- Play with the keyboard: R for Real, S for Scam, and Enter for the next message. Results are announced to screen readers.
- In Haunted view the game becomes a séance table: each right answer lights a candle, and missed ghosts drift up from the words they were hiding in.
- Your answers and score stay in memory only. Nothing is saved or sent.

## Haunted view

Switch on "Haunted view" at the top of the page. The choice is remembered on this device.

- The page becomes a haunted mansion at night, with a moon, bats, lit windows and drifting fog. Every card is lit by a flickering candle.
- Each red flag becomes a ghost placed right after the words it is about. Press a ghost to hear its reason in plain English.
- Look-alike letters, such as the `1` in `paypa1`, twitch and glow. Pressure and threat words slowly bleed. A fake deadline gets a small ghost with a countdown, which ends in "nothing happened".
- Point at or focus a link's ghost and it speaks the link's True Name: where the link really goes, with the suspicious part marked. Phantom Inbox never opens the link to find out.
- The haunt score is a candle that burns down as the score rises.
- "Reduce motion", or the same setting on your device, turns every effect into a still picture. Text keeps WCAG AA contrast in both views.

## Privacy promise

Everything runs in your browser. No message is stored or sent anywhere. There is no backend, no account, no analytics and no tracking. The only things the app remembers are your view choice and your reduced-motion choice.

## Honest results

Results are never 100% certain. A result is a risk level with reasons, not a guarantee that a message is safe or a scam. When in doubt, contact the organisation using a number you already trust.

## Run it

Requires Node.js 20 or later.

```
npm install
npm run dev
npm test
npm run build
```

- `npm install` installs the pinned dependencies.
- `npm run dev` starts the development server.
- `npm test` runs every test once with `vitest --run`.
- `npm run build` writes the static site to `dist/`, ready for GitHub Pages, Netlify or Cloudflare Pages.

## Performance check

After `npm run build`, run `node scripts/perf-mobile.mjs` to test the built site in an installed Chrome or Edge on a simulated phone (4x slower CPU, slow 4G). It writes its results to [docs/perf-mobile.md](docs/perf-mobile.md).

Run `node scripts/ocr-check.mjs` to read two made-up chat screenshots through the built site, under its Content-Security-Policy. It checks the text read, that no other origin is contacted and that nothing is stored, and writes [docs/ocr-check.md](docs/ocr-check.md).

## Assets and licences

No copyrighted images or sounds are used, and nothing loads from another site.

- **Creepster** heading font by Sideshow (Font Diner), under the SIL Open Font License 1.1. It is bundled from the npm package `@fontsource/creepster` and used for headings in Haunted view only. Licence: [public/licenses/creepster-OFL.txt](public/licenses/creepster-OFL.txt).
- **tesseract.js** and **tesseract.js-core** (the screenshot reader and its WebAssembly engine), under the Apache License 2.0. They are bundled from npm and served from this site's `ocr/` folder. Licences: [public/licenses/tesseract.js-Apache-2.0.txt](public/licenses/tesseract.js-Apache-2.0.txt) and [public/licenses/tesseract.js-core-Apache-2.0.txt](public/licenses/tesseract.js-core-Apache-2.0.txt).
- **English language data** for tesseract (`@tesseract.js-data/eng`, MIT, with the model from tesseract-ocr's tessdata under Apache 2.0). Notes: [public/licenses/tesseract-eng-data.txt](public/licenses/tesseract-eng-data.txt).
- Everything else, including the mansion, moon, stars, bats, fog, ghosts, candles and verdict icons, is CSS and inline SVG written for this project and shared under the MIT licence below.
- There are no sounds.

## License
MIT. See [LICENSE](LICENSE).
