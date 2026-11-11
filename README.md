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
- `npm run build` writes the static site to `dist/`, ready for GitHub Pages, Netlify, Cloudflare Pages or Vercel.
- `npm run preview` serves the finished build at http://127.0.0.1:4173 with the same security headers as the hosted site.
- `npm run eval` measures precision and recall of the checker on a local folder of messages (development only). See [docs/EVAL.md](docs/EVAL.md) and [scripts/eval/README.md](scripts/eval/README.md). The corpora are never committed.
- `npm run gen:confusables` and `npm run gen:brands` regenerate the two data files in `src/detection/data/` (they download at development time only).

## Performance check

After `npm run build`, run `node scripts/perf-mobile.mjs` to test the built site in an installed Chrome or Edge on a simulated phone (4x slower CPU, slow 4G). It writes its results to [docs/perf-mobile.md](docs/perf-mobile.md).

Run `node scripts/ocr-check.mjs` to read two made-up chat screenshots through the built site, under its Content-Security-Policy. It checks the text read, that no other origin is contacted and that nothing is stored, and writes [docs/ocr-check.md](docs/ocr-check.md).

## Deploy to Vercel
Phantom Inbox is a static site, so the free Hobby plan on Vercel is enough. Push the repository to GitHub first, then do this in your browser:
1. Sign in at [vercel.com](https://vercel.com). Choose "Continue with GitHub" if you have no account.
2. On the dashboard, click **Add New...** and then **Project**.
3. Under **Import Git Repository**, find your repository. If it is not listed, click **Adjust GitHub App Permissions** (or **Add GitHub Account**), authorize Vercel on GitHub, choose the repository and save. Then click **Import** next to it.
4. On the **Configure Project** screen, set:
   - **Framework Preset**: Vite (or Other; `vercel.json` already says `vite`).
   - **Root Directory**: leave as `./`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
   - **Install Command**: `npm install`.
   - **Environment Variables**: add none. The app needs no keys.
5. Click **Deploy** and wait for the build to finish (about a minute).
6. Click the preview image or **Visit** to open your `*.vercel.app` address. Paste a sample message and press "Check this message" to confirm it works. Open "Haunted view" and "Séance" once too, since those parts load on first use.
7. Optional: open the project, then **Settings** and **Domains**, type your domain, click **Add** and follow the DNS steps Vercel shows.
8. Check the security headers: open your site, press F12, open the **Network** tab, reload, click the first request (the page itself) and read **Response Headers**. You should see `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` and `X-Frame-Options: DENY`. Click a file under `ocr/` (read a screenshot to trigger it) and you should see its own, slightly wider policy that lets the reader run WebAssembly and load its language data from this site only.
Notes on what is configured:
- `vercel.json` sets the build and the headers. The page policy is the one in `csp.ts`. Files in `ocr/` get a second policy (`OCR_WORKER_CSP`) because a worker takes its policy from its own response, and without it screenshot reading does not start.
- Every later push to the main branch deploys again on its own. Pull requests get their own preview address.
- Run `node scripts/dist-check.mjs` after `npm run build` to check that the build has no local paths and works from the site root and from a sub-path.
## End-to-end check and screenshots
`node scripts/journeys.mjs` drives the built site in a real browser on a phone-size and a desktop-size screen, in both views: it checks a scam sample, reads the Exorcism steps, plays a whole Séance game and reads an uploaded screenshot. The pictures are saved in [docs/screenshots/](docs/screenshots/) and the results are in [docs/e2e-journeys.md](docs/e2e-journeys.md). Examples:
- Mortal view on a phone: [result](docs/screenshots/phone-mortal-03-result.png) and [Exorcism](docs/screenshots/phone-mortal-04-exorcism.png).
- Haunted view on a desktop: [result](docs/screenshots/desktop-haunted-03-result.png) and [Séance end](docs/screenshots/desktop-haunted-09-seance-end.png).
The Playwright MCP server is set up in `.kiro/settings/mcp.json` so Kiro can drive the same journeys by hand.
## Bundle size
Heavy parts load only when needed. The first page load is the app shell and the checker (about 309 kB, 99 kB compressed). The domain data (Public Suffix List, look-alike letters and famous sites) is its own file that loads when the browser is idle, never before first paint. The Séance (12 kB), the Haunted backdrop (4 kB) and the screenshot reader (its own files in `ocr/`, several MB) load the first time they are used. Everything is served from this site.
## Assets and licences

No copyrighted images or sound files are used, and nothing loads from another site.

- **Creepster** heading font by Sideshow (Font Diner), under the SIL Open Font License 1.1. It is bundled from the npm package `@fontsource/creepster` and used for headings in Haunted view only. Licence: [public/licenses/creepster-OFL.txt](public/licenses/creepster-OFL.txt).
- **tesseract.js** and **tesseract.js-core** (the screenshot reader and its WebAssembly engine), under the Apache License 2.0. They are bundled from npm and served from this site's `ocr/` folder. Licences: [public/licenses/tesseract.js-Apache-2.0.txt](public/licenses/tesseract.js-Apache-2.0.txt) and [public/licenses/tesseract.js-core-Apache-2.0.txt](public/licenses/tesseract.js-core-Apache-2.0.txt).
- **English language data** for tesseract (`@tesseract.js-data/eng`, MIT, with the model from tesseract-ocr's tessdata under Apache 2.0). Notes: [public/licenses/tesseract-eng-data.txt](public/licenses/tesseract-eng-data.txt).
- Everything else, including the mansion, moon, stars, bats, fog, ghosts, candles and verdict icons, is CSS and inline SVG written for this project and shared under the MIT licence below.
- **tldts** (MIT) reads the Public Suffix List, whose data is under MPL-2.0. Both are compiled into the lazy `detection-data` file. Licence text: [public/licenses/mpl-2.0.txt](public/licenses/mpl-2.0.txt). Sources: https://github.com/remusao/tldts and https://github.com/publicsuffix/list.
- **Unicode confusables.txt** (Unicode License v3), reduced to Latin look-alike letters in `src/detection/data/confusables.ts`. Licence: [public/licenses/unicode-license-v3.txt](public/licenses/unicode-license-v3.txt).
- **Majestic Million** top 1,000 sites (Creative Commons Attribution 3.0, https://creativecommons.org/licenses/by/3.0/), used to spot misspelt copies of famous sites. Majestic subset licensed under CC BY 3.0. Source: https://majestic.com/reports/majestic-million.
- The full table with versions and evidence is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- The only sound is a soft chime made in code with the Web Audio API (no sound file). It is off by default and has a visible on/off button in the Exorcism.

## License
MIT. See [LICENSE](LICENSE).
