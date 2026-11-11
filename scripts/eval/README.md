# Evaluation script (development only, not shipped)

`npm run eval` runs the real detection engine over two local folders and prints precision, recall and the
false-positive rate. It prints counts and file names only, never message content.

```
npm run eval -- --phish eval-data\phish --ham eval-data\ham
npm run eval -- --smoke        # made-up fixtures in scripts/eval/fixtures, to prove the script works
npm run eval -- --json         # same numbers as JSON
```

- Positives: the Nazario phishing corpus (https://monkey.org/~jose/phishing/), mbox files.
- Negatives: SpamAssassin easy_ham and hard_ham (https://spamassassin.apache.org/old/publiccorpus/), one message per file.
- Default folders are `eval-data/phish` and `eval-data/ham`. `eval-data/` is gitignored: never commit a corpus.
- Every regular file is read (extensions are ignored). A file whose first line starts with `From ` is treated as an mbox; the
  envelope line is always dropped before parsing. Files named `cmds` and files over 20 MB are skipped and listed.
- Predicted scam = verdict `suspicious` or `likely scam`. A second, strict table counts only `likely scam`.
- Exit code 2 when a folder is missing.