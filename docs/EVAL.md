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
- Positives: Nazario phishing corpus, all 15 files in the public archive from 2005 to 2025 (8,034 messages). Source: https://monkey.org/~jose/phishing/
- Negatives: SpamAssassin public corpus, `20030228_easy_ham` and `20030228_hard_ham` (2,750 messages). Source: https://spamassassin.apache.org/old/publiccorpus/
- Skipped: 1 message in `phishing-2019.txt` has no email headers (it is a body fragment), so the parser rejects it. It is not counted in any row below. This is a small gap, and it slightly flatters the phishing results.
- The private `private-phishing4.mbox` (31 MB) is not used, because it is not public and the script skips files over 20 MB.

| Counting as scam | TP | FP | TN | FN | Precision | Recall | False-positive rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Suspicious or likely scam | 4,964 | 203 | 2,547 | 3,070 | 96.1% | 61.8% | 7.4% |
| Likely scam only (strict) | 1,663 | 11 | 2,739 | 6,371 | 99.3% | 20.7% | 0.4% |

How to read these: the normal mail is from 2002 to 2003 and the phishing mail is from 2005 to 2025. Dated mail can differ in style, so these numbers are a rough guide only. The default setting catches about 62% of the scams and flags about 1 in 13 normal messages. The strict setting almost never flags normal mail but catches only about 21% of the scams.

`eval-data/` is gitignored. Never commit a corpus; each corpus has its own terms for the person who downloads it.

## How to read the numbers

- Predicted scam = verdict `suspicious` or `likely scam`. The strict table counts only `likely scam`.
- Precision = TP / (TP + FP). Recall = TP / (TP + FN). False-positive rate = FP / (FP + TN). A zero denominator prints `n/a`.
- Results are risk levels, not guarantees.