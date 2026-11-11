# Evaluation of the checker

`npm run eval` runs the real detection engine over a folder of phishing messages and a folder of normal messages and prints precision, recall and the false-positive rate. See [scripts/eval/README.md](../scripts/eval/README.md).

## Latest results

**Status: one real-corpus run done** (a subset: 1 of 3 phishing files). The smoke test below is kept for reference.

### Smoke test on synthetic samples, not the real corpora

- Date: 2026-11-11
- Command: `npm run eval -- --smoke`
- Data: 6 made-up messages in `scripts/eval/fixtures` (4 phishing-style, 2 normal). They prove the script works, including mbox splitting and the envelope line. They are NOT a benchmark and say nothing about real-world accuracy.

| Counting as scam | TP | FP | TN | FN | Precision | Recall | False-positive rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Suspicious or likely scam | 4 | 0 | 2 | 0 | 100.0% | 100.0% | 0.0% |
| Likely scam only (strict) | 3 | 0 | 2 | 1 | 100.0% | 75.0% | 0.0% |

One file (`cmds`, a corpus index file) was skipped, as designed.

### Real corpora

- Date: 2026-11-11
- Command: `npm run eval`
- Positives: Nazario phishing corpus, files `phishing-2022.txt`, `phishing-2023.txt`, `phishing-2024.txt` and `phishing-2025.txt` (1,548 messages). Source: https://monkey.org/~jose/phishing/
- Negatives: SpamAssassin public corpus, `20030228_easy_ham` and `20030228_hard_ham` (2,750 messages). Source: https://spamassassin.apache.org/old/publiccorpus/
- Skipped files: 0. The older Nazario files (2005 to 2007 mboxes and 2015 to 2021) were not used, so this is still a subset.

| Counting as scam | TP | FP | TN | FN | Precision | Recall | False-positive rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Suspicious or likely scam | 892 | 203 | 2,547 | 656 | 81.5% | 57.6% | 7.4% |
| Likely scam only (strict) | 128 | 11 | 2,739 | 1,420 | 92.1% | 8.3% | 0.4% |

How to read these: the normal mail is from 2002 to 2003 and the phishing mail is from 2022 to 2025. Dated mail can differ in style, so these numbers are a rough guide only. The strict setting rarely flags normal mail but misses most scams (recall 8.3%). The default setting catches about 58% of the scams and flags about 1 in 13 normal messages.

`eval-data/` is gitignored. Never commit a corpus; each corpus has its own terms for the person who downloads it.

## How to read the numbers

- Predicted scam = verdict `suspicious` or `likely scam`. The strict table counts only `likely scam`.
- Precision = TP / (TP + FP). Recall = TP / (TP + FN). False-positive rate = FP / (FP + TN). A zero denominator prints `n/a`.
- Results are risk levels, not guarantees.