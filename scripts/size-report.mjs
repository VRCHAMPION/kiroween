// Bundle size report. Reads dist/index.html, gzips the first-paint files and the lazy detection-data chunk.
// Usage: node scripts/size-report.mjs [--save <file>] [--baseline <file>]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const FIRST_PAINT_GROWTH_LIMIT = 25 * 1000;
const CHUNK_LIMIT = 75 * 1000;

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const gzipSize = (file) => gzipSync(readFileSync(join(DIST, file)), { level: 9 }).length;
const kb = (n) => `${(n / 1000).toFixed(2)} kB`;

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const refs = new Set();
for (const m of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"[^>]*>/gi)) {
  const tag = m[0];
  const isAsset = /<script/i.test(tag) || /rel="(?:stylesheet|modulepreload)"/i.test(tag);
  if (isAsset && /\.(?:js|css)$/.test(m[1])) refs.add(m[1].replace(/^\.\//, ''));
}
const firstPaint = [...refs].map((file) => ({ file, gzip: gzipSize(file) }));
const total = firstPaint.reduce((sum, f) => sum + f.gzip, 0);

const assets = readdirSync(join(DIST, 'assets'));
const dataChunk = assets.find((f) => f.startsWith('detection-data') && f.endsWith('.js'));
const lazy = assets
  .filter((f) => /\.(?:js|css)$/.test(f) && !refs.has(`assets/${f}`))
  .map((f) => ({ file: `assets/${f}`, gzip: gzipSize(`assets/${f}`) }));

console.log('First-paint files (referenced by dist/index.html), gzip:');
for (const f of firstPaint) console.log(`  ${f.file.padEnd(52)} ${kb(f.gzip)}`);
console.log(`  ${'TOTAL'.padEnd(52)} ${kb(total)}`);
console.log('Lazy chunks (not referenced by index.html), gzip:');
for (const f of lazy) console.log(`  ${f.file.padEnd(52)} ${kb(f.gzip)}`);
const dataGzip = dataChunk ? gzipSize(`assets/${dataChunk}`) : 0;
console.log(`detection-data chunk: ${dataChunk ? `${dataChunk} ${kb(dataGzip)}` : 'not present'}`);

const report = { firstPaint, firstPaintTotal: total, lazy, detectionData: dataChunk ? { file: dataChunk, gzip: dataGzip } : null };
const save = flag('--save');
if (save) {
  writeFileSync(save, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Saved baseline to ${save}`);
}

let failed = false;
const baselineFile = flag('--baseline');
if (baselineFile) {
  const base = JSON.parse(readFileSync(baselineFile, 'utf8'));
  const growth = total - base.firstPaintTotal;
  console.log(`First-paint growth vs baseline: ${growth >= 0 ? '+' : ''}${kb(growth)} (limit ${kb(FIRST_PAINT_GROWTH_LIMIT)})`);
  if (growth > FIRST_PAINT_GROWTH_LIMIT) {
    console.error('FAIL: first-paint gzip grew by more than 25 kB');
    failed = true;
  }
}
if (dataChunk && html.includes('detection-data')) {
  console.error('FAIL: index.html references the detection-data chunk');
  failed = true;
}
if (dataGzip > CHUNK_LIMIT) {
  console.error('FAIL: detection-data chunk is larger than 75 kB gzip');
  failed = true;
}
process.exit(failed ? 1 : 0);
