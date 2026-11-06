# Phantom Inbox

Every scam has a ghost hiding in it. Phantom Inbox makes it visible.

Phantom Inbox is a scam detector for emails, SMS and WhatsApp messages. It focuses on scams that are common in India, such as KYC expiry, courier fees, electricity disconnection, UPI refunds, fake job offers and "digital arrest". It is built for non-technical adults, elderly parents and anyone learning to spot scams.

## Features (planned)

- **Possession Check** (planned): paste a message and see which words look like a scam and why.
- **Exorcism** (planned): get clear next steps and a short warning to share with family.
- **Séance** (planned): a training game where you decide whether a message is real or a scam.

The app has two views. Mortal view is calm, high contrast and large text. Haunted view shows each red flag as a ghost sitting on the exact words it is about.

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

## License

MIT. See [LICENSE](LICENSE).
