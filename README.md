# Phantom Inbox

Every scam has a ghost hiding in it. Phantom Inbox makes it visible.

Phantom Inbox is a scam detector for emails, SMS and WhatsApp messages. It focuses on scams that are common in India, such as KYC expiry, courier fees, electricity disconnection, UPI refunds, fake job offers and "digital arrest". It is built for non-technical adults, elderly parents and anyone learning to spot scams.

## Features

- **Possession Check** (available): paste a message, pick a sample or open an .eml file, and see which words look like a scam and why.
- **Exorcism** (planned): get clear next steps and a short warning to share with family.
- **Séance** (planned): a training game where you decide whether a message is real or a scam.

The app has two views. Mortal view is calm, high contrast and large text. Haunted view shows each red flag as a ghost sitting on the exact words it is about.

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

## Assets and licences

No copyrighted images or sounds are used, and nothing loads from another site.

- **Creepster** heading font by Sideshow (Font Diner), under the SIL Open Font License 1.1. It is bundled from the npm package `@fontsource/creepster` and used for headings in Haunted view only. Licence: [public/licenses/creepster-OFL.txt](public/licenses/creepster-OFL.txt).
- Everything else, including the mansion, moon, stars, bats, fog, ghosts, candles and verdict icons, is CSS and inline SVG written for this project and shared under the MIT licence below.
- There are no sounds.

## License
MIT. See [LICENSE](LICENSE).
