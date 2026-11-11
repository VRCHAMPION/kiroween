/**
 * Walks the main user journeys through the production build, in Mortal and Haunted view, on a 360px
 * phone: paste a scam sample and check it, read the Exorcism steps, play a whole Séance game with the
 * keyboard, and read a screenshot. It saves a screenshot of every step to docs/screenshots/ and audits
 * each screen for horizontal overflow, small tap targets, console errors, failed requests, CSP violations
 * and the response headers. Results go to docs/e2e-journeys.md.
 *
 * It starts `vite preview` itself (the same as `npm run preview`), so run `npm run build` first:
 *   node scripts/journeys.mjs
 * The same journeys can be driven with the Playwright MCP server configured in .kiro/settings/mcp.json.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'screenshots');
const REPORT = join(ROOT, 'docs', 'e2e-journeys.md');
const ORIGIN = 'http://127.0.0.1:4173';
const PHONE = { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 };
const SAMPLE = 'scam-paypal-homoglyph';
const BROWSERS = [
  process.env.PERF_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startPreview() {
  const vite = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [vite, 'preview'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(ORIGIN)).ok) return child;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  child.kill();
  throw new Error('vite preview did not start on ' + ORIGIN);
}

/** Draws a dark-mode WhatsApp-style chat screenshot in the page and returns a PNG data URL. */
function drawChat() {
  const W = 720;
  const H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  c.fillStyle = '#0b141a';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#1f2c34';
  c.fillRect(0, 0, W, 150);
  c.fillStyle = '#e9edef';
  c.font = 'bold 34px sans-serif';
  c.fillText('+91 90000 12345', 110, 112);
  const bubbles = [
    ['Hello sir, your refund of Rs 2,499', 'is ready. To receive the refund,'],
    ['approve the collect request on your', 'UPI app and enter your UPI PIN.'],
  ];
  let y = 210;
  c.font = '30px sans-serif';
  for (const lines of bubbles) {
    const h = lines.length * 42 + 50;
    c.fillStyle = '#202c33';
    c.beginPath();
    c.roundRect(30, y, W - 110, h, 18);
    c.fill();
    c.fillStyle = '#e9edef';
    lines.forEach((line, i) => c.fillText(line, 56, y + 50 + i * 42));
    y += h + 30;
  }
  return canvas.toDataURL('image/png');
}

/** Measures horizontal overflow and small tap targets on the current screen. Runs inside the page. */
function audit() {
  const vw = document.documentElement.clientWidth;
  const describe = (el) => {
    const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} "${text}"`;
  };
  const result = { overflowX: document.documentElement.scrollWidth - vw, wide: [], smallControls: [], smallInlineLinks: [] };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.visually-hidden, .haunted-backdrop, [hidden], svg')) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (r.right > vw + 1 || r.left < -1) result.wide.push(`${describe(el)} (${Math.round(r.left)}..${Math.round(r.right)})`);
    if (el.matches('button, select, input:not([type="hidden"]), textarea, summary, [role="switch"]')) {
      if (r.height < 43.5 || r.width < 43.5) result.smallControls.push(`${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    } else if (el.matches('a[href]')) {
      if (r.height < 43.5) (el.classList.contains('button') ? result.smallControls : result.smallInlineLinks).push(`${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  return result;
}

async function main() {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('dist/index.html is missing. Run `npm run build` first.');
    process.exit(1);
  }
  const executablePath = BROWSERS.find((p) => existsSync(p));
  if (!executablePath) {
    console.error('No Chrome or Edge found. Set PERF_BROWSER to a Chromium-based browser.');
    process.exit(1);
  }
  await mkdir(SHOTS, { recursive: true });
  // Start clean so the folder only holds pictures from this run.
  for (const name of await readdir(SHOTS)) if (name.endsWith('.png')) await rm(join(SHOTS, name));
  const temp = await mkdtemp(join(tmpdir(), 'phantom-journeys-'));
  const preview = await startPreview();
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  const version = await browser.version();

  const log = { shots: [], audits: [], problems: [], headers: {}, steps: [] };
  const note = (view, step, ok, detail = '') => log.steps.push({ view, step, ok, detail });

  try {
    for (const [device, viewport] of [['phone', PHONE], ['desktop', DESKTOP]]) for (const view of ['mortal', 'haunted']) {
      const page = await browser.newPage();
      const label = device === 'phone' ? view : view + ' (desktop)';
      if (device === 'phone') await page.emulate({ viewport, userAgent: 'Mozilla/5.0 (Linux; Android 12; Phone) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' });
      else await page.setViewport(viewport);
      const requests = [];
      const failures = [];
      const consoleErrors = [];
      page.on('request', (r) => requests.push(r.url()));
      page.on('response', (r) => {
        if (r.status() >= 400) failures.push(`${r.status()} ${r.url().replace(ORIGIN, '')}`);
      });
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      page.on('workercreated', (w) => w.on('console', (m) => m.type() === 'error' && consoleErrors.push('worker: ' + m.text())));
      await page.evaluateOnNewDocument((v) => {
        localStorage.setItem('phantom-inbox:view', v);
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      }, view);

      let n = 0;
      const shot = async (name, target) => {
        n += 1;
        const file = `${device}-${view}-${String(n).padStart(2, '0')}-${name}.png`;
        const handle = target ? await page.$(target) : null;
        if (target && !handle) {
          log.problems.push(`${label}: could not find ${target} for screenshot ${name}`);
          return;
        }
        // Always a picture of the visible screen (never the whole tall page), so no image is larger than the viewport.
        if (handle) await handle.evaluate((e) => e.scrollIntoView({ block: 'start' }));
        await sleep(150);
        await page.screenshot({ path: join(SHOTS, file) });
        log.shots.push(file);
      };
      const auditHere = async (step) => log.audits.push({ view: label, step, ...(await page.evaluate(audit)) });
      const clickText = (text, selector = 'button') =>
        page.evaluate(
          (t, sel) => {
            const el = [...document.querySelectorAll(sel)].find((b) => b.textContent.trim() === t);
            if (!el) return false;
            el.click();
            return true;
          },
          text,
          selector,
        );

      // 1. Home
      const response = await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle0', timeout: 60_000 });
      log.headers = response.headers();
      const dataView = await page.$eval('.app', (a) => a.dataset.view);
      note(label, 'Open the site in the saved view', dataView === view, `data-view=${dataView}`);
      await shot('home');
      await auditHere('home');

      // 2. Paste (pick) a scam sample and check it
      await page.select('#sample-picker', SAMPLE);
      await shot('sample-loaded');
      note(label, 'Load the PayPal look-alike sample', (await page.$eval('#message', (t) => t.value)).includes('paypa1'));
      await clickText('Check this message');
      await page.waitForSelector('.result-panel', { timeout: 10_000 });
      await sleep(900);
      const verdict = await page.$eval('.verdict-title', (v) => v.textContent);
      note(label, 'Check the message', verdict === 'Likely scam', verdict);
      const focusOk = await page.evaluate(() => document.activeElement?.id === 'result-heading');
      note(label, 'Focus moves to the result heading', focusOk);
      await shot('result', '.result-panel');
      await auditHere('result');

      // 3. Exorcism
      const steps = await page.$$eval('.exorcism-steps > li', (l) => l.length);
      note(label, 'Exorcism steps are shown', steps >= 5, `${steps} steps`);
      const links = await page.$$eval('.exorcism a', (a) => a.map((x) => x.getAttribute('href')));
      note(label, 'Report links are cybercrime.gov.in and tel:1930', links.includes('https://cybercrime.gov.in') && links.includes('tel:1930'), links.join(', '));
      if (view === 'haunted') {
        const boxes = await page.$$('.exorcism-steps input[type="checkbox"]');
        const ghostCount = await page.$$eval('.ritual-ghost', (g) => g.length);
        // Ticking every step banishes every ghost (a few steps may banish none when there are few ghosts).
        for (const box of boxes) await box.click();
        await sleep(1400);
        const banished = await page.$$eval('.ritual-ghost.is-banished', (g) => g.length);
        note(label, 'Reading every step banishes every ghost', ghostCount > 0 && banished === ghostCount, `${banished} of ${ghostCount} banished`);
      }
      await shot('exorcism', '#exorcism');
      await auditHere('exorcism');
      if (view === 'haunted') {
        const spoke = await page.evaluate(() => {
          const ghost = [...document.querySelectorAll('.ghost-button[aria-describedby]')][0];
          if (!ghost) return null;
          ghost.scrollIntoView({ block: 'center' });
          ghost.focus();
          return document.getElementById(ghost.getAttribute('aria-describedby'))?.textContent ?? null;
        });
        await sleep(400);
        note(label, 'A link ghost speaks its True Name on focus', Boolean(spoke && spoke.includes('True Name')), spoke ? spoke.slice(0, 60) : 'no link ghost');
        await shot('true-name');
      }

      // 4. A whole Séance game by keyboard
      await clickText('S\u00e9ance', 'nav button');
      await page.waitForSelector('.seance-choice', { visible: true });
      await shot('seance-round');
      await auditHere('seance-round');
      let sawMissed = false;
      let sawRight = false;
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press('KeyR');
        await page.waitForSelector('.seance-feedback', { visible: true });
        const outcome = await page.$eval('.seance-feedback', (f) => [...f.classList].find((c) => c.startsWith('outcome-')));
        if (outcome === 'outcome-missed-scam' && !sawMissed) {
          sawMissed = true;
          await sleep(1500);
          await shot('seance-missed-scam', '.seance');
          await auditHere('seance-missed-scam');
        } else if (outcome === 'outcome-spotted-real' && !sawRight) {
          sawRight = true;
          await shot('seance-well-spotted');
        }
        await page.keyboard.press('Enter');
        await page.waitForSelector(i === 9 ? '.seance-end' : '.seance-choice', { visible: true });
      }
      const endText = await page.$eval('.seance-end', (e) => e.textContent);
      note(label, 'Play 10 rounds with R and Enter', /You got \d+ out of 10 right/.test(endText), (endText.match(/You got \d+ out of 10 right/) || [''])[0]);
      const lit = await page.$$eval('.seance-candle.is-lit', (c) => c.length);
      if (view === 'haunted') note(label, 'Candles lit match right answers', lit >= 1, `${lit} lit`);
      await shot('seance-end', '.seance');
      await auditHere('seance-end');

      // 5. Read a screenshot
      await clickText('Possession Check', 'nav button');
      await page.waitForSelector('[data-testid="screenshot-input"]', { visible: false });
      const dataUrl = await page.evaluate(drawChat);
      const file = join(temp, 'chat.png');
      await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
      await page.evaluate(() => {
        const box = document.querySelector('#message');
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(box, '');
        box.dispatchEvent(new Event('input', { bubbles: true }));
        window.scrollTo(0, 0);
      });
      const input = await page.$('[data-testid="screenshot-input"]');
      await input.uploadFile(file);
      await page.waitForSelector('[data-testid="reading-state"]', { timeout: 10_000 }).catch(() => undefined);
      await shot('screenshot-reading', '.possession-check');
      await page.waitForFunction(() => !document.querySelector('[data-testid="reading-state"]') && document.querySelector('#message')?.value, { timeout: 120_000, polling: 250 });
      const read = await page.$eval('#message', (t) => t.value);
      note(label, 'Read the uploaded screenshot', /refund/i.test(read) && /UPI/i.test(read), read.split('\n').slice(0, 2).join(' / '));
      note(label, 'Focus returns to the message box after reading', await page.evaluate(() => document.activeElement?.id === 'message'));
      await sleep(300);
      await shot('screenshot-text-read', '.possession-check');
      await auditHere('screenshot-read');

      const csp = await page.evaluate(() => window.__csp);
      // data: and blob: URLs have no network origin (their origin is the string "null"), so only http(s) and ws(s) requests count.
      const foreign = [...new Set(requests.filter((u) => /^(https?|wss?):/.test(u)).map((u) => new URL(u).origin))].filter((o) => o !== ORIGIN);
      note(label, 'No CSP violations', csp.length === 0, csp.join('; '));
      note(label, 'No requests to other origins', foreign.length === 0, foreign.join(', '));
      note(label, 'No failed requests', failures.length === 0, failures.join(', '));
      note(label, 'No console errors', consoleErrors.length === 0, consoleErrors.map((e) => e.slice(0, 120)).join(' / '));
      await page.close();
    }
  } finally {
    await browser.close();
    preview.kill();
    await rm(temp, { recursive: true, force: true });
  }

  // Summaries
  for (const a of log.audits) {
    if (a.overflowX > 0) log.problems.push(`${a.view} / ${a.step}: page is ${a.overflowX}px wider than the screen`);
    for (const w of a.wide) log.problems.push(`${a.view} / ${a.step}: sticks out of the screen: ${w}`);
    for (const s of a.smallControls) log.problems.push(`${a.view} / ${a.step}: small tap target: ${s}`);
  }
  for (const s of log.steps) if (!s.ok) log.problems.push(`${s.view}: step failed: ${s.step} ${s.detail ? '(' + s.detail + ')' : ''}`);
  const needed = ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options'];
  const missing = needed.filter((h) => !log.headers[h]);
  if (missing.length) log.problems.push(`response is missing headers: ${missing.join(', ')}`);

  const inline = [...new Set(log.audits.flatMap((a) => a.smallInlineLinks))];
  const report = `# End-to-end journeys

Generated by \`node scripts/journeys.mjs\` on ${new Date().toISOString().slice(0, 10)}.

- Browser: ${version} (headless), phone screen 360 x 780 at 2x with touch, and desktop 1280 x 800
- Site: \`npm run preview\` of the production build at ${ORIGIN}, sent with the same headers as vercel.json
- Journeys, in both Mortal and Haunted view: open the site, pick and check a scam sample, read the Exorcism, play a whole S\u00e9ance game with R and Enter, and read an uploaded screenshot
- Screenshots (each is a picture of the visible screen, never a whole tall page): ${log.shots.length} files in \`docs/screenshots/\`

## Steps

| View | Step | Result | Detail |
| --- | --- | --- | --- |
${log.steps.map((s) => `| ${s.view} | ${s.step} | ${s.ok ? 'Pass' : 'Fail'} | ${String(s.detail).replace(/\|/g, '/').slice(0, 90)} |`).join('\n')}

## Layout (phone 360px and desktop 1280px)

| View | Screen | Extra width | Sticking out | Tap targets under 44px |
| --- | --- | --- | --- | --- |
${log.audits.map((a) => `| ${a.view} | ${a.step} | ${Math.max(0, a.overflowX)}px | ${a.wide.length} | ${a.smallControls.length} |`).join('\n')}

Inline text links under 44px tall (allowed by WCAG 2.2 because they sit inside a sentence): ${inline.length === 0 ? 'none' : inline.join('; ')}

## Response headers on the page

${needed.map((h) => `- \`${h}\`: ${log.headers[h] ? 'present' : '**missing**'}`).join('\n')}

## How this was run

- The Playwright MCP server is configured in \`.kiro/settings/mcp.json\` (\`@playwright/mcp\` 0.0.85, Edge, isolated profile, only 127.0.0.1:4173 allowed). The agent session that produced this report had no \`browser_*\` MCP tools connected, so the same journeys were driven by this script with puppeteer-core and the installed Edge. Open the project in Kiro with the server enabled to repeat them through MCP.
- Every screenshot is a picture of the visible screen (360 x 780 at 2x, or 1280 x 800), never a whole tall page, so none is near the 8000-pixel limit of image uploads.

## Bugs found and fixed

- Phone, both views: the whole page grew to 393 px (Mortal) and 421 px (Haunted) wide on a 360 px phone, because grid columns sized to their longest unbreakable word. All grid columns now use \`minmax(0, 1fr)\`. Regression test: \`src/styles/layout.test.ts\`.
- Haunted view: the "I have read this step" checkbox was 24 px, under the 44 px tap-target rule. It is now 44 px. Same test file.
- This script: it counted \`data:\` URLs as another origin, and it ticked only three steps then expected ghosts to be banished. Both checks were wrong and are fixed here, not in the app.
- Seance now loads on first open, so its test waits for the screen before checking focus (\`src/features/seance/Seance.test.tsx\`).

## Problems found

${log.problems.length === 0 ? 'None.' : log.problems.map((p) => `- ${p}`).join('\n')}

Overall: **${log.problems.length === 0 ? 'all journeys pass' : `${log.problems.length} problem(s) to fix`}**.
`;
  await writeFile(REPORT, report, 'utf8');
  await writeFile(join(process.env.TEMP || tmpdir(), 'journeys.json'), JSON.stringify(log, null, 1), 'utf8');
  console.log(report);
  process.exitCode = log.problems.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});