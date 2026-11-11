// Dev-only evaluation: runs the real detection engine over local folders of phishing and normal mail.
// Usage: npm run eval -- [--phish <dir>] [--ham <dir>] [--smoke] [--json]
// Prints counts and file names only, never message content.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyse, ensureDetectionData } from '../../src/detection';
import { parseEml } from '../../src/email/parse-eml';
import { toAnalysisInput } from '../../src/features/possession-check/to-analysis-input';
import { discoverFiles } from './discover';
import { metricsOf, percent, type Counts } from './metrics';
import { splitMessages } from './mbox';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const smoke = flag('--smoke');
const phishDir = resolve(value('--phish') ?? (smoke ? join(ROOT, 'scripts', 'eval', 'fixtures', 'phish') : join(ROOT, 'eval-data', 'phish')));
const hamDir = resolve(value('--ham') ?? (smoke ? join(ROOT, 'scripts', 'eval', 'fixtures', 'ham') : join(ROOT, 'eval-data', 'ham')));

for (const dir of [phishDir, hamDir]) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`Folder not found: ${dir}`);
    console.error('Download the Nazario phishing corpus (https://monkey.org/~jose/phishing/) into eval-data/phish and the');
    console.error('SpamAssassin easy_ham / hard_ham files (https://spamassassin.apache.org/old/publiccorpus/) into eval-data/ham,');
    console.error('or pass --phish <dir> --ham <dir>. Use --smoke to run the made-up fixtures.');
    process.exit(2);
  }
}

await ensureDetectionData();

interface Tally {
  messages: number;
  suspicious: number;
  likely: number;
  skipped: Array<{ file: string; reason: string }>;
}

function scan(dir: string): Tally {
  const found = discoverFiles(dir);
  const tally: Tally = { messages: 0, suspicious: 0, likely: 0, skipped: [...found.skipped] };
  for (const file of found.files) {
    let messages: string[];
    try {
      messages = splitMessages(readFileSync(file, 'latin1'));
    } catch {
      tally.skipped.push({ file, reason: 'unreadable' });
      continue;
    }
    if (messages.length === 0) tally.skipped.push({ file, reason: 'no message found' });
    for (const raw of messages) {
      try {
        const verdict = analyse(toAnalysisInput(parseEml(raw))).verdict;
        tally.messages += 1;
        if (verdict === 'likely scam') tally.likely += 1;
        else if (verdict === 'suspicious') tally.suspicious += 1;
      } catch {
        tally.skipped.push({ file, reason: 'could not be analysed' });
      }
    }
  }
  return tally;
}

const phish = scan(phishDir);
const ham = scan(hamDir);

const loose: Counts = {
  tp: phish.suspicious + phish.likely,
  fn: phish.messages - phish.suspicious - phish.likely,
  fp: ham.suspicious + ham.likely,
  tn: ham.messages - ham.suspicious - ham.likely,
};
const strict: Counts = { tp: phish.likely, fn: phish.messages - phish.likely, fp: ham.likely, tn: ham.messages - ham.likely };

function table(title: string, counts: Counts): string {
  const m = metricsOf(counts);
  return [
    title,
    `  TP ${m.tp}  FP ${m.fp}  TN ${m.tn}  FN ${m.fn}  (messages ${m.total})`,
    `  precision ${percent(m.precision)}  recall ${percent(m.recall)}  false-positive rate ${percent(m.falsePositiveRate)}`,
  ].join('\n');
}

if (flag('--json')) {
  console.log(JSON.stringify({ smoke, phish: phish.messages, ham: ham.messages, loose: metricsOf(loose), strict: metricsOf(strict) }, null, 2));
} else {
  console.log(smoke ? 'SMOKE TEST on made-up fixtures. These numbers are NOT a benchmark.' : 'Evaluation on local corpora.');
  console.log(`Positives: ${phishDir} (${phish.messages} messages)`);
  console.log(`Negatives: ${hamDir} (${ham.messages} messages)`);
  console.log('Predicted scam = verdict "suspicious" or "likely scam".');
  console.log(table('Suspicious or worse counts as scam:', loose));
  console.log(table('Only "likely scam" counts as scam (strict):', strict));
  const skipped = [...phish.skipped, ...ham.skipped];
  console.log(`Skipped: ${skipped.length}`);
  for (const s of skipped.slice(0, 20)) console.log(`  ${s.file}: ${s.reason}`);
}