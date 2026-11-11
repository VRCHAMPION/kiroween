/**
 * End-to-end screenshot check for Phantom Inbox.
 *
 * Serves the production build (with its Content-Security-Policy meta tag) on 127.0.0.1, opens it
 * in an installed Edge or Chrome, draws two phone chat screenshots (a light SMS and a dark-mode
 * WhatsApp chat), and reads each through the app's real tesseract.js path. It records the text
 * read, how long it took, every request origin, browser storage, and any CSP violation, then
 * checks the read text and writes docs/ocr-check.md.
 *
 * Run after `npm run build`:  node scripts/ocr-check.mjs
 */
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { responseHeaders } from './vercel-headers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const REPORT = join(ROOT, 'docs', 'ocr-check.md');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
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

/** The made-up chats drawn into the screenshots, one bubble per line group. */
const CHATS = [
  {
    name: 'Light SMS',
    dark: false,
    sender: 'VM-VNDBNK',
    bubbles: [
      ['Dear customer, your Vandana Bank', 'KYC has expired. Your account will', 'be blocked within 24 hours.'],
      ['Update KYC now:', 'https://bit.ly/vb-kyc-2291'],
    ],
    expect: ['kyc', 'expired', 'account', 'blocked', 'within', '24', 'hours', 'update', 'bit.ly'],
    verdict: 'Likely scam',
  },
  {
    name: 'Dark WhatsApp',
    dark: true,
    sender: '+91 90000 12345',
    bubbles: [
      ['Hello sir, your refund of Rs 2,499', 'is ready. To receive the refund,'],
      ['approve the collect request on your', 'UPI app and enter your UPI PIN.'],
    ],
    expect: ['refund', 'ready', 'receive', 'approve', 'collect', 'request', 'upi', 'pin'],
    verdict: 'Likely scam',
  },
];

function serve() {
  return new Promise((done) => {
    const server = createServer(async (req, res) => {
      try {
        const path = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
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
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

/** Draws a phone chat screenshot on a canvas in the page and returns it as a PNG data URL. */
function drawChat(chat) {
  const W = 720;
  const H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const bg = chat.dark ? '#0b141a' : '#f2f2f7';
  const bar = chat.dark ? '#1f2c34' : '#ffffff';
  const bubble = chat.dark ? '#202c33' : '#ffffff';
  const ink = chat.dark ? '#e9edef' : '#111111';
  const muted = chat.dark ? '#8696a0' : '#6b6b70';
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  c.fillStyle = bar;
  c.fillRect(0, 0, W, 150);
  c.fillStyle = muted;
  c.font = '24px sans-serif';
  c.fillText('10:42', 30, 40);
  c.fillText('4G  87%', W - 140, 40);
  c.fillStyle = ink;
  c.font = 'bold 34px sans-serif';
  c.fillText(chat.sender, 110, 112);
  c.fillStyle = muted;
  c.beginPath();
  c.arc(60, 100, 30, 0, Math.PI * 2);
  c.fill();
  let y = 210;
  c.font = '30px sans-serif';
  for (const lines of chat.bubbles) {
    const h = lines.length * 42 + 50;
    c.fillStyle = bubble;
    c.beginPath();
    c.roundRect(30, y, W - 110, h, 18);
    c.fill();
    c.fillStyle = ink;
    lines.forEach((line, i) => c.fillText(line, 56, y + 50 + i * 42));
    c.fillStyle = muted;
    c.font = '20px sans-serif';
    c.fillText('10:41 am', W - 190, y + h - 14);
    c.font = '30px sans-serif';
    y += h + 30;
  }
  return canvas.toDataURL('image/png');
}

const words = (text) => text.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').split(/\s+/).filter(Boolean);

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
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  const version = await browser.version();
  const temp = await mkdtemp(join(tmpdir(), 'phantom-ocr-'));
  const requests = [];
  const consoleErrors = [];
  const failed = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 900 });
    page.on('request', (r) => requests.push({ url: r.url(), at: Date.now() }));
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(origin, '')}`);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('workercreated', (worker) => {
      worker.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(`worker: ${m.text()}`);
      });
    });
    await page.evaluateOnNewDocument(() => {
      window.__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      window.__stages = [];
      new MutationObserver(() => {
        const s = document.querySelector('[data-testid="reading-state"] [role="status"]')?.textContent;
        if (s && window.__stages[window.__stages.length - 1] !== s) window.__stages.push(s);
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await page.goto(`${origin}/`, { waitUntil: 'networkidle0', timeout: 60_000 });
    const cspMeta = await page.$eval('meta[http-equiv="Content-Security-Policy"]', (m) => m.content).catch(() => '');
    const initialRequests = requests.map((r) => r.url);
    const ocrBeforeUse = initialRequests.filter((u) => u.includes('/ocr/') || /\/assets\/src-/.test(u));

    const results = [];
    for (const [index, chat] of CHATS.entries()) {
      const dataUrl = await page.evaluate(drawChat, chat);
      const file = join(temp, `chat-${index}.png`);
      await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
      await page.evaluate(() => {
        window.__stages = [];
        const box = document.querySelector('#message');
        if (box) {
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          setter.call(box, '');
          box.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      const input = await page.$('[data-testid="screenshot-input"]');
      const started = Date.now();
      await input.uploadFile(file);
      await page.waitForFunction(
        () => !document.querySelector('[data-testid="reading-state"]') && (document.querySelector('#message')?.value || document.querySelector('[role="alert"]')),
        { timeout: 180_000, polling: 250 },
      );
      const seconds = (Date.now() - started) / 1000;
      const text = await page.$eval('#message', (t) => t.value);
      const alert = await page.$eval('[role="alert"]', (a) => a.textContent).catch(() => '');
      const stages = await page.evaluate(() => window.__stages);
      const got = new Set(words(text));
      const found = chat.expect.filter((w) => [...got].some((g) => g.includes(w)));
      await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Check this message')?.click());
      await page.waitForSelector('.result-panel', { timeout: 10_000 }).catch(() => undefined);
      const verdict = await page.$eval('.verdict-title', (v) => v.textContent).catch(() => '');
      const nextSteps = await page.$$eval('.exorcism-steps > li', (lis) => lis.length).catch(() => 0);
      results.push({ chat, seconds, text, alert, stages, found, verdict, nextSteps });
    }

    const storage = await page.evaluate(async () => ({
      indexedDB: typeof indexedDB.databases === 'function' ? (await indexedDB.databases()).map((d) => d.name) : ['(cannot list)'],
      localStorage: Object.keys(localStorage),
      caches: typeof caches !== 'undefined' ? await caches.keys() : [],
      cookies: document.cookie,
    }));
    const csp = await page.evaluate(() => window.__csp);
    const foreign = [...new Set(requests.map((r) => new URL(r.url).origin))].filter((o) => o !== origin && o !== 'null' && !o.startsWith('data:'));
    const ocrFiles = [...new Set(requests.map((r) => r.url).filter((u) => u.includes('/ocr/')).map((u) => u.slice(origin.length)))];
    const allowedKeys = ['phantom-inbox:view', 'phantom-inbox:reduced-motion'];

    const checks = [
      ['Production CSP is in effect', cspMeta.includes("connect-src 'none'") && cspMeta.includes("script-src 'self'"), cspMeta ? 'meta tag present' : 'missing'],
      ['No CSP violations', csp.length === 0, csp.length === 0 ? 'none' : csp.join('; ')],
      ['No request to another origin', foreign.length === 0, foreign.length === 0 ? 'none' : foreign.join(', ')],
      ['OCR code not loaded before a screenshot is added', ocrBeforeUse.length === 0, ocrBeforeUse.length === 0 ? 'not loaded' : ocrBeforeUse.join(', ')],
      ['OCR files loaded from this site', ocrFiles.some((f) => f.includes('/ocr/lang/')) && ocrFiles.some((f) => f.includes('/ocr/core/')), ocrFiles.join(', ')],
      ['Nothing written to IndexedDB', storage.indexedDB.length === 0, storage.indexedDB.length === 0 ? 'no databases' : storage.indexedDB.join(', ')],
      ['localStorage holds only the two preferences', storage.localStorage.every((k) => allowedKeys.includes(k)), storage.localStorage.length === 0 ? 'empty' : storage.localStorage.join(', ')],
      ['No Cache Storage or cookies', storage.caches.length === 0 && storage.cookies === '', storage.caches.length === 0 && storage.cookies === '' ? 'none' : 'found'],
      ...results.map((r) => [
        `${r.chat.name}: at least 80% of key words read`,
        r.found.length / r.chat.expect.length >= 0.8,
        `${r.found.length} of ${r.chat.expect.length} in ${r.seconds.toFixed(1)} s`,
      ]),
      ...results.map((r) => [`${r.chat.name}: checked as "${r.chat.verdict}" with next steps`, r.verdict === r.chat.verdict && r.nextSteps > 0, `${r.verdict || 'no result'}, ${r.nextSteps} steps`]),
    ];
    const passed = checks.every(([, ok]) => ok);

    const fence = '```';
    const report = `# Screenshot reading check

Generated by \`node scripts/ocr-check.mjs\` on ${new Date().toISOString().slice(0, 10)}.

- Browser: ${version} (headless)
- Site: the production build in \`dist/\`, served from ${origin.replace(/:\d+$/, '')} with its Content-Security-Policy meta tag
- Screenshots: two 720 x 1280 phone chats drawn by the script, one light and one in dark mode

## Checks

| Check | Result | Value |
| --- | --- | --- |
${checks.map(([name, ok, value]) => `| ${name} | ${ok ? 'Pass' : 'Fail'} | ${String(value).replace(/\|/g, '/')} |`).join('\n')}

${results
  .map(
    (r) => `## ${r.chat.name}

Progress shown: ${r.stages.map((s) => `"${s}"`).join(', ') || '(none captured)'}

Text read (${r.seconds.toFixed(1)} s, first read includes loading the reader):

${fence}text
${r.text || r.alert}
${fence}
`,
  )
  .join('\n')}
## Notes

- The first read downloads the worker, one WebAssembly core and the English data (about 7 MB) from this site. The browser's normal HTTP cache keeps them for later; the app itself stores nothing.
- Failed requests: ${failed.length === 0 ? 'none' : failed.join(', ')}
- Console errors seen: ${consoleErrors.length === 0 ? 'none' : consoleErrors.map((e) => e.slice(0, 160)).join(' / ')}

Overall: **${passed ? 'all checks pass' : 'some checks fail'}**.
`;
    await writeFile(REPORT, report, 'utf8');
    console.log(report);
    process.exitCode = passed ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
    await rm(temp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});