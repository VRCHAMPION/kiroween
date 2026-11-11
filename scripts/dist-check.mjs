/**
 * Checks the production build in dist/ before deploying:
 *  1. No file in dist/ (apart from the OCR engine files, which are third-party code) holds a local
 *     absolute path (d:\, C:\, /Users/, file://) and index.html has no root-absolute URL.
 *  2. The site loads and works from the site root AND from a sub-path (/some/sub/path/), the way
 *     GitHub Pages and other hosts serve it, including the lazily loaded Seance and Haunted chunks.
 *     It is served with the headers from vercel.json and the CSP is watched for violations.
 *
 * Run after `npm run build`:  node scripts/dist-check.mjs
 */
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { responseHeaders } from './vercel-headers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.gz': 'application/gzip',
  '.txt': 'text/plain; charset=utf-8',
};
const BROWSERS = [
  process.env.PERF_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`);
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

/** Serves dist/ under `prefix` (for example "/" or "/some/sub/path/"). */
function serve(prefix) {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (!url.startsWith(prefix)) return void res.writeHead(404).end('not found');
      const path = '/' + url.slice(prefix.length);
      let file = normalize(join(DIST, path));
      if (!file.startsWith(DIST)) return void res.writeHead(403).end();
      if ((await stat(file).catch(() => undefined))?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, responseHeaders(path, TYPES[extname(file)] ?? 'application/octet-stream'));
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

async function scanFiles() {
  const files = await walk(DIST);
  const hits = [];
  const patterns = [/[a-zA-Z]:\\(Users|projects|Windows)/, /\/Users\/[A-Za-z]/, /file:\/\//, /\\projects\\/i];
  for (const file of files) {
    const rel = file.slice(DIST.length + 1).replace(/\\/g, '/');
    if (rel.startsWith('ocr/') || /\.(woff2?|gz)$/.test(rel)) continue; // third-party engine and binary files
    const text = await readFile(file, 'utf8');
    for (const p of patterns) if (p.test(text)) hits.push(`${rel} matches ${p}`);
  }
  check('No local absolute path in the app files', hits.length === 0, hits.join('; ') || `${files.length} files scanned`);
  const html = await readFile(join(DIST, 'index.html'), 'utf8');
  const rootAbsolute = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
  check('index.html has no root-absolute URL', rootAbsolute.length === 0, rootAbsolute.join(', '));
  const external = [...html.matchAll(/(?:src|href|content)="(https?:\/\/[^"]*)"/g)].map((m) => m[1]);
  check('index.html has no URL to another origin', external.length === 0, external.join(', '));
  const css = (await Promise.all(files.filter((f) => f.endsWith('.css')).map((f) => readFile(f, 'utf8')))).join('\n');
  const cssAbsolute = [...css.matchAll(/url\(\s*["']?(\/[^)"']*)/g)].map((m) => m[1]);
  check('CSS has no root-absolute url()', cssAbsolute.length === 0, cssAbsolute.join(', '));
}

async function loadFrom(browser, prefix) {
  const server = await serve(prefix);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const failures = [];
  const errors = [];
  page.on('response', (r) => r.status() >= 400 && failures.push(`${r.status()} ${r.url().replace(origin, '')}`));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)));
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('phantom-inbox:view', 'haunted');
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  try {
    const response = await page.goto(`${origin}${prefix}`, { waitUntil: 'networkidle0', timeout: 60_000 });
    const where = prefix === '/' ? 'site root' : `sub-path ${prefix}`;
    check(`Loads from the ${where}`, response?.status() === 200 && Boolean(await page.$('.app')));
    check(`Haunted backdrop chunk loads (${where})`, Boolean(await page.waitForSelector('.haunted-backdrop', { timeout: 10_000 }).catch(() => null)));
    const favicon = await page.$eval('link[rel="icon"]', (l) => new URL(l.href).pathname);
    // The page cannot fetch anything (connect-src 'none'), so ask the server directly.
    const iconResponse = (await fetch(origin + favicon)).status;
    check(`Favicon is found (${where})`, iconResponse === 200, favicon);
    await page.evaluate(() => [...document.querySelectorAll('nav button')].find((b) => b.textContent.includes('ance'))?.click());
    check(`Seance chunk loads on first open (${where})`, Boolean(await page.waitForSelector('.seance-choice', { visible: true, timeout: 10_000 }).catch(() => null)));
    const footer = await page.$eval('footer', (f) => f.textContent.trim());
    check(`Footer note is shown (${where})`, footer === 'Not a guarantee. When in doubt, call your bank on the number on your card.');
    const csp = await page.evaluate(() => window.__csp);
    check(`No CSP violations (${where})`, csp.length === 0, csp.join('; '));
    check(`No failed requests or console errors (${where})`, failures.length === 0 && errors.length === 0, [...failures, ...errors].join('; '));
  } finally {
    await page.close();
    server.close();
  }
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/index.html is missing. Run `npm run build` first.');
    process.exit(1);
  }
  const executablePath = BROWSERS.find((p) => existsSync(p));
  if (!executablePath) {
    console.error('No Chrome or Edge found. Set PERF_BROWSER to a Chromium-based browser.');
    process.exit(1);
  }
  await scanFiles();
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  try {
    await loadFrom(browser, '/');
    await loadFrom(browser, '/some/sub/path/');
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(failed.length === 0 ? 'Overall: all checks pass.' : `Overall: ${failed.length} check(s) failed.`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
