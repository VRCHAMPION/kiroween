# Third-party notices

Every third-party item in Phantom Inbox, with its licence and the evidence read. Dates are the day the primary source was read (2026-11-11). Nothing loads from another origin: all of it is served from this site.

| Item | Version | Licence | Source | Where it ships | Evidence |
| --- | --- | --- | --- | --- | --- |
| @fontsource/creepster (Creepster font) | 5.3.0 | SIL OFL 1.1 | https://fonts.google.com/specimen/Creepster | woff2 in `dist/assets` | [public/licenses/creepster-OFL.txt](public/licenses/creepster-OFL.txt) |
| tesseract.js | 7.0.0 | Apache-2.0 | https://github.com/naptha/tesseract.js | `ocr/` folder | [public/licenses/tesseract.js-Apache-2.0.txt](public/licenses/tesseract.js-Apache-2.0.txt) |
| tesseract.js-core | as installed | Apache-2.0 | https://github.com/naptha/tesseract.js-core | `ocr/` folder | [public/licenses/tesseract.js-core-Apache-2.0.txt](public/licenses/tesseract.js-core-Apache-2.0.txt) |
| English language data (@tesseract.js-data/eng) | 1.0.0 | MIT (model: Apache-2.0) | https://github.com/naptha/tessdata | `ocr/lang/` | [public/licenses/tesseract-eng-data.txt](public/licenses/tesseract-eng-data.txt) |
| tldts | 7.4.19 | MIT | https://github.com/remusao/tldts | compiled into the lazy `detection-data` chunk | read in package: `node_modules/tldts/package.json` field `license` is `MIT`, and its `LICENSE` file begins "Permission is hereby granted, free of charge, to any person obtaining a copy of this software". Read 2026-11-11. |
| tldts-core (dependency of tldts) | 7.4.20 | MIT | https://github.com/remusao/tldts | same chunk | read in package: `license` is `MIT`. Installed transitively; tldts 7.4.19 pins it and `package-lock.json` fixes the exact version. |
| Public Suffix List (compiled into tldts) | as bundled by tldts 7.4.19 | MPL-2.0 | https://github.com/publicsuffix/list, https://publicsuffix.org/list/ | same chunk (compiled, not shipped as a raw file) | MPL-2.0 text fetched from `https://raw.githubusercontent.com/publicsuffix/list/main/LICENSE` on 2026-11-11 and kept in [public/licenses/mpl-2.0.txt](public/licenses/mpl-2.0.txt). It begins "Mozilla Public License Version 2.0". Source for the list and for tldts is at the two URLs above, which satisfies the source-availability condition for the compiled form. |
| Unicode `confusables.txt` (Unicode 18.0.0, file dated 2026-08-06) | 18.0.0 | Unicode License v3 | https://www.unicode.org/Public/security/latest/confusables.txt | reduced to 494 single-character Latin look-alike mappings in `src/detection/data/confusables.ts` (lazy chunk) | File header read 2026-11-11: "For terms of use and license, see https://www.unicode.org/terms_of_use.html" with the copyright line "© 2026 Unicode®, Inc.". `https://www.unicode.org/license.txt` read the same day: it is "UNICODE LICENSE V3" and grants permission to "use, copy, modify, merge, publish, distribute, and/or sell copies" provided the notice appears with copies. Text kept in [public/licenses/unicode-license-v3.txt](public/licenses/unicode-license-v3.txt); the generated file header carries the copyright and terms lines. |
| Majestic Million (top 1,000 domains) | list downloaded 2026-11-11 | Creative Commons Attribution 3.0 Unported | https://majestic.com/reports/majestic-million | `src/detection/data/top-brands.ts` (lazy chunk) | Page source read 2026-11-11: under "License", "Licensed under a Creative Commons Attribution 3.0 Unported License" linking to https://creativecommons.org/licenses/by/3.0. Attribution: Majestic (https://majestic.com), Majestic Million. Majestic subset licensed under CC BY 3.0. |
| tsx (development only, not shipped) | 4.23.15 | MIT | https://github.com/privatenumber/tsx | not shipped | read in package: `license` is `MIT`; `LICENSE` starts "MIT License / Copyright (c) Hiroki Osame". Read 2026-11-11. |
| esbuild (dependency of tsx, development only) | 0.28.2 | MIT | https://github.com/evanw/esbuild | not shipped | read in package: `license` is `MIT`; `LICENSE.md` starts "MIT License / Copyright (c) 2020 Evan Wallace". |

## Skipped on purpose

| Item | Why it was not added |
| --- | --- |
| Tranco top-sites list (https://tranco-list.eu/) | The page states no licence for the list and blends components with non-commercial and share-alike terms, so redistribution of a derived subset is unclear. Not downloaded, not committed. The Majestic Million (CC BY 3.0) is used instead. |
| Freesound CC0 sound | CC0 files cannot be fetched and verified without a login, so no Freesound file is used and no Freesound attribution is made. The Exorcism chime is generated in code with the Web Audio API (no asset, no licence). |
| Nosifer font | Not needed: Creepster is already bundled, self-hosted and readable for headings, so it was kept. |

## Evaluation corpora (never committed, never shipped)

The Nazario phishing corpus (https://monkey.org/~jose/phishing/) and the SpamAssassin public corpus (https://spamassassin.apache.org/old/publiccorpus/) are downloaded by the developer into the gitignored `eval-data/` folder for `npm run eval`. Their own terms apply to the developer; no part of them is in this repository.
