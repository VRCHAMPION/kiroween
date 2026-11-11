/**
 * Mobile performance check for Phantom Inbox.
 *
 * Serves the production build from dist/ on 127.0.0.1, opens it in an installed Chrome or Edge
 * with a phone screen, 4x CPU slowdown and slow 4G, and records load timings, frame rate while
 * the Haunted view result animates and while scrolling, long tasks, layout shift, request
 * origins, and running animations with reduced motion. Results go to docs/perf-mobile.md.
 *
 * Run after `npm run build`:  node scripts/perf-mobile.mjs
 * Set PERF_BROWSER to a browser path to choose a different browser.
 */
import { existsSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import puppeteer, { PredefinedNetworkConditions } from 'puppeteer-core';
import { responseHeaders } from './vercel-headers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const REPORT = join(ROOT, 'docs', 'perf-mobile.md');
const SAMPLE = 'scam-digital-arrest';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
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

const PHONE = {
  viewport: { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  userAgent:
    'Mozilla/5.0 (Linux; Android 12; Phone) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
};

function serve() {
  return new Promise((done) => {
    const server = createServer(async (req, res) => {
      try {
        const path = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
        let file = normalize(join(DIST, path));
        if (!file.startsWith(DIST)) {
          res.writeHead(403).end();
          return;
        }
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

/** Counts frames with requestAnimationFrame for `ms`, optionally scrolling the page each frame. */
function measureFrames(ms, scroll) {
  return new Promise((resolveFrames) => {
    const gaps = [];
    const start = performance.now();
    let last = start;
    let direction = 1;
    const tick = (now) => {
      gaps.push(now - last);
      last = now;
      if (scroll) {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (scrollY >= max - 4) direction = -1;
        if (scrollY <= 0) direction = 1;
        scrollBy(0, 9 * direction);
      }
      if (now - start < ms) {
        requestAnimationFrame(tick);
      } else {
        const sorted = [...gaps].sort((a, b) => a - b);
        resolveFrames({
          fps: gaps.length / ((now - start) / 1000),
          p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
          worst: sorted[sorted.length - 1] ?? 0,
          over50: gaps.filter((g) => g > 50).length,
        });
      }
    };
    requestAnimationFrame(tick);
  });
}

async function openPage(browser, url, { view, reducedMotion }) {
  const page = await browser.newPage();
  await page.emulate(PHONE);
  await page.emulateCPUThrottling(4);
  await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 4G']);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }]);
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.evaluateOnNewDocument((v) => {
    localStorage.setItem('phantom-inbox:view', v);
    window.__perf = { cls: 0, longTasks: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.longTasks.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  }, view);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
  const load = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { fcp: fcp ? fcp.startTime : NaN, domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd };
  });
  return { page, requests, load };
}

async function checkSample(page) {
  await page.select('#sample-picker', SAMPLE);
  const ms = await page.evaluate(
    () =>
      new Promise((done) => {
        const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Check this message');
        const start = performance.now();
        button.click();
        requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now() - start)));
      }),
  );
  await page.waitForSelector('.result-panel');
  return ms;
}

/**
 * Opens Séance and answers with the keyboard, always "real": real messages light candles and scams
 * are missed, so their ghosts drift up. Answers at least `rounds` messages, then stops on the first
 * missed scam so the measured screen has ghosts on it.
 */
async function playSeance(page, rounds) {
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find((b) => b.textContent === 'S\u00e9ance')?.click());
  await page.waitForSelector('.seance-choice', { visible: true });
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('KeyR');
    await page.waitForSelector('.seance-feedback', { visible: true });
    const ghosts = await page.$$eval('.seance-missed .ghost-button', (b) => b.length);
    if ((i + 1 >= rounds && ghosts > 0) || i === 9) break;
    await page.keyboard.press('Enter');
    await page.waitForSelector('.seance-choice', { visible: true });
  }
  return page.evaluate(() => ({
    lit: document.querySelectorAll('.seance-candle.is-lit').length,
    candles: document.querySelectorAll('.seance-candle').length,
    ghosts: document.querySelectorAll('.seance-missed .ghost-button').length,
  }));
}

async function distSizes() {
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(join(DIST, 'assets'));
  const out = { js: 0, css: 0, font: 0 };
  for (const f of files) {
    const body = await readFile(join(DIST, 'assets', f));
    if (f.endsWith('.js')) out.js += gzipSync(body).length;
    else if (f.endsWith('.css')) out.css += gzipSync(body).length;
    else if (f.endsWith('.woff2')) out.font += body.length;
  }
  return out;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const msText = (n) => `${Math.round(n)} ms`;

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
  const url = `${origin}/`;
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  const version = await browser.version();

  try {
    // Mortal view: first load, and the heading font must not be downloaded.
    const mortal = await openPage(browser, url, { view: 'mortal', reducedMotion: false });
    const mortalFont = mortal.requests.some((r) => r.includes('creepster'));
    await mortal.page.close();

    // Haunted view: load, check a busy sample, then measure frames while ghosts animate and while scrolling.
    const haunted = await openPage(browser, url, { view: 'haunted', reducedMotion: false });
    const checkMs = await checkSample(haunted.page);
    await new Promise((r) => setTimeout(r, 2000));
    const windowStart = await haunted.page.evaluate(() => performance.now());
    const idle = await haunted.page.evaluate(measureFrames, 5000, false);
    const scroll = await haunted.page.evaluate(measureFrames, 3000, true);
    const perf = await haunted.page.evaluate(() => window.__perf);
    const running = await haunted.page.evaluate(() => document.getAnimations().length);
    const ghostCount = await haunted.page.evaluate(() => document.querySelectorAll('.ghost-button').length);
    const fontLoaded = await haunted.page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('32px Creepster');
    });
    const metrics = await haunted.page.metrics();
    const hauntedFont = haunted.requests.some((r) => r.includes('creepster'));
    await haunted.page.close();

    // Haunted view with reduced motion: every CSS animation must be gone.
    const calm = await openPage(browser, url, { view: 'haunted', reducedMotion: true });
    await checkSample(calm.page);
    await new Promise((r) => setTimeout(r, 1000));
    const calmRunning = await calm.page.evaluate(() => document.getAnimations().length);
    const calmSmil = await calm.page.evaluate(() => document.querySelectorAll('.score-candle animate, .score-candle animateTransform').length);
    await calm.page.close();

    // Séance in Haunted view: candles lit and missed ghosts on screen, measured idle and while scrolling.
    const seance = await openPage(browser, url, { view: 'haunted', reducedMotion: false });
    const seanceInfo = await playSeance(seance.page, 5);
    await new Promise((r) => setTimeout(r, 1800));
    const seanceStart = await seance.page.evaluate(() => performance.now());
    const seanceIdle = await seance.page.evaluate(measureFrames, 4000, false);
    const seanceScroll = await seance.page.evaluate(measureFrames, 3000, true);
    const seancePerf = await seance.page.evaluate(() => window.__perf);
    const seanceLong = seancePerf.longTasks.filter((t) => t.start >= seanceStart);
    const seanceRunning = await seance.page.evaluate(() => document.getAnimations().length);
    await seance.page.close();

    // Séance with reduced motion: no candle flicker, no drifting ghosts.
    const seanceCalm = await openPage(browser, url, { view: 'haunted', reducedMotion: true });
    await playSeance(seanceCalm.page, 3);
    await new Promise((r) => setTimeout(r, 800));
    const seanceCalmRunning = await seanceCalm.page.evaluate(() => document.getAnimations().length);
    await seanceCalm.page.close();

    const allRequests = [...mortal.requests, ...haunted.requests, ...calm.requests, ...seance.requests, ...seanceCalm.requests];
    const foreign = [...new Set(allRequests.map((r) => new URL(r).origin))].filter((o) => o !== origin && o !== 'null');
    const longDuringAnimation = perf.longTasks.filter((t) => t.start >= windowStart);
    const blockingDuringAnimation = longDuringAnimation.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0);
    const sizes = await distSizes();

    const checks = [
      ['Only same-origin requests (no network calls elsewhere)', foreign.length === 0, foreign.length === 0 ? 'none' : foreign.join(', ')],
      ['Heading font not downloaded in Mortal view', !mortalFont, mortalFont ? 'downloaded' : 'not requested'],
      ['Heading font loaded in Haunted view', hauntedFont && fontLoaded, fontLoaded ? 'Creepster ready' : 'missing'],
      ['Frame rate while ghosts animate at least 50 fps', idle.fps >= 50, `${idle.fps.toFixed(1)} fps`],
      ['Frame rate while scrolling at least 45 fps', scroll.fps >= 45, `${scroll.fps.toFixed(1)} fps`],
      ['No long tasks while the result animates', longDuringAnimation.length === 0, `${longDuringAnimation.length} (blocking ${msText(blockingDuringAnimation)})`],
      ['Layout shift below 0.1', perf.cls < 0.1, perf.cls.toFixed(3)],
      ['No CSS animations with reduced motion', calmRunning === 0, String(calmRunning)],
      ['No candle melt with reduced motion', calmSmil === 0, String(calmSmil)],
      ['S\u00e9ance: frame rate with candles and ghosts at least 50 fps', seanceIdle.fps >= 50, `${seanceIdle.fps.toFixed(1)} fps`],
      ['S\u00e9ance: frame rate while scrolling at least 45 fps', seanceScroll.fps >= 45, `${seanceScroll.fps.toFixed(1)} fps`],
      ['S\u00e9ance: no long tasks while it animates', seanceLong.length === 0, `${seanceLong.length}`],
      ['S\u00e9ance: layout shift below 0.1', seancePerf.cls < 0.1, seancePerf.cls.toFixed(3)],
      ['S\u00e9ance: no CSS animations with reduced motion', seanceCalmRunning === 0, String(seanceCalmRunning)],
    ];
    const passed = checks.every(([, ok]) => ok);

    const report = `# Mobile performance check

Generated by \`node scripts/perf-mobile.mjs\` on ${new Date().toISOString().slice(0, 10)}.

- Browser: ${version} (headless, software rendering, so real phones with a GPU usually do better)
- Phone: 360 x 640 CSS pixels at 3x, touch, 4x CPU slowdown, Slow 4G network
- Scenario: Haunted view, sample "${SAMPLE}" checked (${ghostCount} ghosts on screen)

## Checks

| Check | Result | Value |
| --- | --- | --- |
${checks.map(([name, ok, value]) => `| ${name} | ${ok ? 'Pass' : 'Fail'} | ${value} |`).join('\n')}

## Measurements

| Measurement | Mortal view | Haunted view |
| --- | --- | --- |
| First contentful paint | ${msText(mortal.load.fcp)} | ${msText(haunted.load.fcp)} |
| DOM content loaded | ${msText(mortal.load.domContentLoaded)} | ${msText(haunted.load.domContentLoaded)} |
| Load event | ${msText(mortal.load.load)} | ${msText(haunted.load.load)} |

| Haunted view result | Value |
| --- | --- |
| Click to result painted (4x slower CPU) | ${msText(checkMs)} |
| Frame rate, ghosts animating | ${idle.fps.toFixed(1)} fps (95th percentile frame ${msText(idle.p95)}, worst ${msText(idle.worst)}, ${idle.over50} frames over 50 ms) |
| Frame rate, scrolling | ${scroll.fps.toFixed(1)} fps (95th percentile frame ${msText(scroll.p95)}, worst ${msText(scroll.worst)}, ${scroll.over50} frames over 50 ms) |
| Running CSS animations | ${running} |
| JavaScript heap used | ${kb(metrics.JSHeapUsedSize)} |
| Long tasks during page load and check | ${perf.longTasks.length - longDuringAnimation.length} |

| S\u00e9ance in Haunted view (answered "real" until a scam was missed) | Value |
| --- | --- |
| Candles lit / on the table | ${seanceInfo.lit} / ${seanceInfo.candles} |
| Missed ghosts on screen | ${seanceInfo.ghosts} |
| Frame rate, idle | ${seanceIdle.fps.toFixed(1)} fps (95th percentile frame ${msText(seanceIdle.p95)}, worst ${msText(seanceIdle.worst)}) |
| Frame rate, scrolling | ${seanceScroll.fps.toFixed(1)} fps (95th percentile frame ${msText(seanceScroll.p95)}, worst ${msText(seanceScroll.worst)}) |
| Running CSS animations | ${seanceRunning} |

| Build size | Value |
| --- | --- |
| JavaScript (gzip) | ${kb(sizes.js)} |
| CSS (gzip) | ${kb(sizes.css)} |
| Heading font (woff2) | ${kb(sizes.font)} |

Overall: **${passed ? 'all checks pass' : 'some checks fail'}**.
`;
    await writeFile(REPORT, report, 'utf8');
    console.log(report);
    process.exitCode = passed ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});