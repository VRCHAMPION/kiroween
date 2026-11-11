---
name: evaluation
description: How to test the Phantom Inbox detection engine, regenerate its data files and run the precision and recall evaluation
---

# Test and evaluation workflow

## Tests

- `npm test` runs every test once (`vitest --run`); never use watch mode.
- `npx vitest --run src/detection` runs the engine tests only (the `detection-tests` hook does this on save).
- Each rule file has one `<rule>.test.ts` next to it. Property tests use fast-check with at least 100 runs and a one-sentence comment above them stating the property.
- `npm run typecheck`, `npm run lint` (zero warnings) and `npm run build` must also pass.

## Regenerate data (dev time only, uses the network)

- `npm run gen:confusables` rewrites `src/detection/data/confusables.ts`.
- `npm run gen:brands` rewrites `src/detection/data/top-brands.ts` (`npm run gen:brands -- --top 500` for a smaller list).
- Commit the generated files; never commit downloaded datasets.

## Evaluate

- `npm run eval -- --smoke` runs made-up fixtures in `scripts/eval/fixtures`. It proves the script works and is not a benchmark.
- `npm run eval -- --phish eval-data\phish --ham eval-data\ham` measures precision, recall and false-positive rate. Download the Nazario phishing corpus (https://monkey.org/~jose/phishing/) and the SpamAssassin public corpus (https://spamassassin.apache.org/old/publiccorpus/) into the gitignored `eval-data/` folder first.
- Predicted scam = `suspicious` or `likely scam`; a strict table counts only `likely scam`.
- Record the latest table in `docs/EVAL.md`, labelled as smoke test or real corpora.

## Bundle check

After `npm run build`, `node scripts/size-report.mjs` reports first-paint files and the lazy `detection-data` chunk.