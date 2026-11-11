import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CSP, OCR_WORKER_CSP } from '../csp';
import { OCR_ASSETS } from '../ocr-assets';
import { headersFor, responseHeaders } from '../scripts/vercel-headers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const exists = (rel: string) => existsSync(join(ROOT, rel));
const lower = (s: string) => s.toLowerCase();

const STEERING = ['product.md', 'tech.md', 'structure.md', 'design-system.md', 'security-privacy.md'];
const TRIGGERS = [
  'PreToolUse',
  'PostToolUse',
  'SessionStart',
  'Stop',
  'UserPromptSubmit',
  'PreTaskExec',
  'PostTaskExec',
  'PostFileCreate',
  'PostFileSave',
  'PostFileDelete',
];

interface HookEntry {
  name: string;
  trigger: string;
  matcher?: string;
  action: { type: string; command?: string; prompt?: string };
}
interface HookFile {
  version: string;
  hooks: HookEntry[];
}
const hook = (id: string) => JSON.parse(read(`.kiro/hooks/${id}.json`)) as HookFile;
const matcherOf = (id: string) => new RegExp(hook(id).hooks[0].matcher as string);

/** Returns the text inside the last pair of backticks on the bullet line for a hook. */
function documentedMatcher(doc: string, hookName: string): string | undefined {
  const line = doc.split(/\r?\n/).find((l) => l.startsWith(`- \`${hookName}\``));
  if (!line) return undefined;
  const parts = line.split('`');
  return parts.length >= 3 ? parts[parts.length - 2] : undefined;
}

// ---------- Journal helpers ----------
export const ENTRY_PATTERN = /^- (\d{4}-\d{2}-\d{2}) \| ([^|]+?) \| ([^|]+)$/;
interface JournalEntry {
  date: string;
  feature: string;
  description: string;
}
const sentenceCount = (text: string) => (text.match(/[.!?](?=\s|$)/g) ?? []).length;
function parseEntryLine(line: string): JournalEntry | undefined {
  const m = ENTRY_PATTERN.exec(line);
  return m ? { date: m[1], feature: m[2], description: m[3] } : undefined;
}
function isValidEntryLine(line: string): boolean {
  const e = parseEntryLine(line);
  if (!e || e.feature.trim() === '' || e.feature !== e.feature.trim()) return false;
  const n = sentenceCount(e.description);
  return n >= 1 && n <= 2;
}
function formatEntryLine(e: JournalEntry): string {
  return `- ${e.date} | ${e.feature} | ${e.description}`;
}

// ---------- Steering ----------
describe('steering documents: format', () => {
  it('has exactly the five steering documents', () => {
    const files = readdirSync(join(ROOT, '.kiro/steering')).filter((f) => f.endsWith('.md'));
    expect(files.sort()).toEqual([...STEERING].sort());
  });

  it.each(STEERING)('%s starts with front matter "inclusion: always" and has at most 200 lines', (name) => {
    const text = read(`.kiro/steering/${name}`);
    const lines = text.replace(/\r?\n$/, '').split(/\r?\n/);
    expect(lines[0], `${name}: line 1 must be ---`).toBe('---');
    const end = lines.indexOf('---', 1);
    expect(end, `${name}: front matter is not closed`).toBeGreaterThan(0);
    expect(lines.slice(1, end).map((l) => l.trim()), `${name}: inclusion must be always`).toContain(
      'inclusion: always',
    );
    expect(lines.length, `${name}: more than 200 lines`).toBeLessThanOrEqual(200);
  });
});

describe('steering: product.md', () => {
  const doc = read('.kiro/steering/product.md');
  const required: [string, string][] = [
    ['pitch', 'Every scam has a ghost hiding in it. Phantom Inbox makes it visible.'],
    ['user group: non-technical adults', 'non-technical adults'],
    ['user group: elderly parents', 'elderly parents'],
    ['user group: scam-awareness learners', 'scam-awareness learners'],
    ['category: KYC expiry', 'kyc expiry'],
    ['category: courier', 'courier'],
    ['category: customs', 'customs'],
    ['category: electricity disconnection', 'electricity bill disconnection'],
    ['category: UPI refunds', 'upi refunds'],
    ['category: collect requests', 'collect requests'],
    ['category: fake job/task offers', 'fake job'],
    ['category: digital arrest', 'digital arrest'],
    ['feature: Possession Check', 'possession check'],
    ['feature: Exorcism', 'exorcism'],
    ['feature: S\u00e9ance', 's\u00e9ance'],
    ['Mortal view', 'mortal view'],
    ['Haunted view', 'haunted view'],
    ['spooky design rationale', 'easier to understand'],
    ['Non-goals heading', '## non-goals'],
    ['non-goal: backend services', 'backend services'],
    ['non-goal: paid APIs', 'paid apis'],
    ['non-goal: user accounts', 'user accounts'],
    ['non-goal: message storage', 'message storage'],
    ['non-goal: tracking', 'tracking'],
    ['certainty statement', '100% certainty'],
    ['risk level statement', 'risk level'],
  ];
  it.each(required)('product.md contains %s', (label, phrase) => {
    expect(lower(doc).includes(lower(phrase)), `product.md: missing ${label}`).toBe(true);
  });
  it('product.md is at most 10,000 characters', () => {
    expect(doc.length).toBeLessThanOrEqual(10000);
  });
});

describe('steering: tech.md', () => {
  const doc = read('.kiro/steering/tech.md');
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
  const stack = ['React', 'Vite', 'TypeScript (strict mode)', 'Vitest', 'fast-check', 'jsdom', 'Testing Library', 'axe-core', 'ESLint'];

  it.each(stack)('tech.md stack lists %s exactly once', (tool) => {
    const bullets = doc.split(/\r?\n/).filter((l) => l.startsWith(`- ${tool}:`));
    expect(bullets.length, `tech.md: stack entry for ${tool}`).toBe(1);
  });

  it('package.json defines exactly the six documented scripts', () => {
    expect(Object.keys(pkg.scripts).sort()).toEqual(['build', 'dev', 'lint', 'preview', 'test', 'typecheck']);
  });

  it.each(['dev', 'build', 'typecheck', 'lint', 'test', 'preview'])('tech.md documents script %s with its real command', (name) => {
    expect(doc.includes(`\`${name}\` (\`${pkg.scripts[name]}\`)`), `tech.md: script ${name} mismatch`).toBe(true);
  });

  it.each([
    ['single-run tests', 'vitest --run'],
    ['zero network calls', 'zero network calls'],
    ['exact pinning', 'pinned to an exact version'],
    ['GitHub Pages', 'GitHub Pages'],
    ['Netlify', 'Netlify'],
    ['Cloudflare Pages', 'Cloudflare Pages'],
    ['PowerShell compatibility', 'PowerShell'],
  ])('tech.md states %s', (label, phrase) => {
    expect(doc.includes(phrase), `tech.md: missing ${label}`).toBe(true);
  });

  it.each([
    ['run-tests', 'PostFileSave'],
    ['rule-tests', 'PostFileCreate, PostFileSave'],
    ['a11y-check', 'PostFileCreate, PostFileSave'],
    ['journal', 'PostTaskExec'],
  ])('tech.md lists hook %s with trigger %s', (name, trigger) => {
    expect(doc.includes(`- \`${name}\` (${trigger})`), `tech.md: hook ${name}`).toBe(true);
  });
});

describe('steering: structure.md', () => {
  const doc = read('.kiro/steering/structure.md');
  it('starts with a level-1 heading after the front matter', () => {
    const body = doc.split(/\r?\n/).slice(3).find((l) => l.trim() !== '');
    expect(body?.startsWith('# ')).toBe(true);
  });
  it.each(['src/', 'src/components/', 'src/detection/', 'src/detection/rules/', 'src/styles/', 'docs/', '.kiro/steering/', '.kiro/hooks/', '.kiro/specs/'])(
    'structure.md lists %s',
    (path) => {
      expect(doc.includes(`- \`${path}\`:`), `structure.md: missing ${path}`).toBe(true);
    },
  );
  it.each([
    ['co-located test rule', 'sit next to the code'],
    ['conformance test location', 'tests/repo-conformance.test.ts'],
    ['rule test naming', '<rule>.test.ts'],
    ['component naming', 'PascalCase.tsx'],
    ['rule naming', 'kebab-case.ts'],
    ['style naming', 'kebab-case.css'],
  ])('structure.md states %s', (label, phrase) => {
    expect(doc.includes(phrase), `structure.md: missing ${label}`).toBe(true);
  });
  it.each(['run-tests', 'rule-tests', 'a11y-check'])('documented matcher for %s equals the hook file', (id) => {
    expect(documentedMatcher(doc, id), `structure.md: matcher mismatch for hook ${id}`).toBe(hook(id).hooks[0].matcher);
    expect(documentedMatcher(read('.kiro/steering/tech.md'), id), `tech.md: matcher mismatch for hook ${id}`).toBe(
      hook(id).hooks[0].matcher,
    );
  });
});

describe('steering: design-system.md', () => {
  const doc = read('.kiro/steering/design-system.md');
  it.each(['## Tokens: Mortal view', '## Tokens: Haunted view', '4.5:1', '3:1', '18px', '16px', '2px', '1 to 40 characters', 'prefers-reduced-motion', 'can only add reduction', 'persists across page reloads', 'fully readable'])(
    'design-system.md contains "%s"',
    (phrase) => {
      expect(doc.includes(phrase), `design-system.md: missing ${phrase}`).toBe(true);
    },
  );
  it.each(['--color-bg', '--color-surface', '--color-text', '--color-text-muted', '--color-accent-flag', '--color-border', '--color-focus', '--font-family', '--font-size-body', '--font-size-heading', '--space-1', '--space-2', '--space-3', '--space-4'])(
    'design-system.md defines %s for both views',
    (token) => {
      expect(doc.split(`\`${token}\``).length - 1, `design-system.md: ${token}`).toBeGreaterThanOrEqual(2);
    },
  );
});

describe('steering: security-privacy.md', () => {
  const doc = read('.kiro/steering/security-privacy.md');
  it.each([
    ['no backend', 'no backend'],
    ['message content never in requests', 'no network request carries message content'],
    ['storage list', 'localstorage, sessionstorage, indexeddb, cookies, urls'],
    ['logs', 'logs'],
    ['no analytics', 'no analytics'],
    ['no third-party scripts', 'third-party scripts'],
    ['plain-text rendering', 'plain text'],
    ['no dangerouslySetInnerHTML', 'dangerouslysetinnerhtml'],
    ['no 100% certainty', '100% certainty'],
    ['dev server exemption', 'development server is exempt'],
  ])('security-privacy.md states %s', (label, phrase) => {
    expect(lower(doc).includes(phrase), `security-privacy.md: missing ${label}`).toBe(true);
  });
  it('the CSP code block equals csp.ts', () => {
    const block = /```text\r?\n([^`]*default-src[^`]*)\r?\n```/.exec(doc);
    expect(block, 'security-privacy.md: no CSP code block').not.toBeNull();
    expect(block?.[1].trim()).toBe(CSP);
  });
  it('the CSP blocks connections and inline or eval scripts', () => {
    expect(CSP).toContain("connect-src 'none'");
    expect(CSP).toContain("script-src 'self'");
    expect(CSP).not.toMatch(/unsafe-(inline|eval)/);
  });
});

// ---------- Hosting (vercel.json) ----------
describe('hosting: vercel.json', () => {
  const config = JSON.parse(read('vercel.json')) as {
    framework: string;
    buildCommand: string;
    outputDirectory: string;
  };
  const header = (path: string, name: string) => headersFor(path).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
  it('serves the Vite build from dist', () => {
    expect(config.framework).toBe('vite');
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist');
  });
  it.each(['/', '/index.html', '/assets/index-abc.js'])('%s gets the page CSP from csp.ts', (path) => {
    expect(header(path, 'Content-Security-Policy')).toBe(CSP);
  });
  it('OCR files get the worker policy from csp.ts', () => {
    for (const asset of OCR_ASSETS) expect(header(`/${asset.path}`, 'Content-Security-Policy'), asset.path).toBe(OCR_WORKER_CSP);
  });
  it('the worker policy allows no other origin and no unsafe-inline or unsafe-eval', () => {
    expect(OCR_WORKER_CSP).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(OCR_WORKER_CSP).toContain("connect-src 'self'");
    expect(OCR_WORKER_CSP).not.toMatch(/(?<!wasm-)unsafe-(inline|eval)|https?:|\*/);
  });
  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'no-referrer'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
    ['X-Frame-Options', 'DENY'],
  ])('sends %s: %s on every path, including OCR files', (name, value) => {
    for (const path of ['/', '/assets/x.js', '/ocr/worker.min.js']) expect(header(path, name), `${path} ${name}`).toBe(value);
  });
  it('a .wasm file is served as application/wasm', () => {
    expect(responseHeaders('/ocr/core/engine.wasm', 'application/octet-stream')['content-type']).toBe('application/wasm');
  });
  it('every OCR asset keeps its declared content type', () => {
    for (const asset of OCR_ASSETS) expect(responseHeaders(`/${asset.path}`, asset.contentType)['content-type'], asset.path).toBe(asset.contentType);
  });
  it('the security-privacy steering document names the worker policy', () => {
    expect(read('.kiro/steering/security-privacy.md')).toContain('OCR_WORKER_CSP');
  });
});

// ---------- Page metadata ----------
describe('index.html metadata', () => {
  const html = read('index.html');
  const meta = (attr: string, name: string) => new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`).exec(html)?.[1];
  it('has a title and a description', () => {
    expect(html).toContain('<title>Phantom Inbox</title>');
    expect(meta('name', 'description')?.length ?? 0).toBeGreaterThan(40);
  });
  it.each(['og:type', 'og:site_name', 'og:title', 'og:description'])('has the Open Graph tag %s', (name) => {
    expect(meta('property', name), name).toBeTruthy();
  });
  it('uses no URL to another origin in the head', () => {
    const head = /<head>([\s\S]*)<\/head>/.exec(html)?.[1] ?? '';
    expect(head).not.toMatch(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/);
  });
  it('links the ghost favicon file by a relative path, and the file exists', () => {
    expect(html).toContain('href="./favicon.svg"');
    expect(exists('public/favicon.svg')).toBe(true);
    expect(read('public/favicon.svg')).toContain('<svg');
  });
});

// ---------- Hooks ----------
describe('hooks', () => {
  const ids = ['run-tests', 'rule-tests', 'a11y-check', 'journal'];
  it.each(ids)('%s.json is a valid v1 hook file', (id) => {
    const file = hook(id);
    expect(file.version, `${id}: version`).toBe('v1');
    expect(file.hooks.length, `${id}: no entries`).toBeGreaterThan(0);
    for (const entry of file.hooks) {
      expect(entry.name.trim().length, `${id}: empty name`).toBeGreaterThan(0);
      expect(TRIGGERS, `${id}: unknown trigger ${entry.trigger}`).toContain(entry.trigger);
      if (entry.action.type === 'command') {
        expect(typeof entry.action.command, `${id}: command missing`).toBe('string');
      } else {
        expect(entry.action.type, `${id}: action type`).toBe('agent');
        expect(entry.action.prompt?.length ?? 0, `${id}: prompt missing`).toBeGreaterThan(0);
      }
      if (entry.matcher !== undefined) {
        expect(() => new RegExp(entry.matcher as string), `${id}: invalid regex`).not.toThrow();
      }
    }
  });

  it('run-tests runs vitest once on save', () => {
    const [entry] = hook('run-tests').hooks;
    expect(entry.trigger).toBe('PostFileSave');
    expect(entry.action).toEqual({ type: 'command', command: 'npx vitest --run' });
  });

  it.each(['rule-tests', 'a11y-check'])('%s has one entry per trigger, the same matcher, and a scope limit', (id) => {
    const file = hook(id);
    expect(file.hooks.map((h) => h.trigger).sort()).toEqual(['PostFileCreate', 'PostFileSave']);
    expect(new Set(file.hooks.map((h) => h.matcher)).size).toBe(1);
    for (const entry of file.hooks) {
      expect(entry.action.type).toBe('agent');
      expect(entry.action.prompt, `${id}: no scope limit in prompt`).toMatch(/Do not edit/);
    }
  });

  it('journal runs after each task with no matcher', () => {
    const [entry] = hook('journal').hooks;
    expect(entry.trigger).toBe('PostTaskExec');
    expect(entry.matcher).toBeUndefined();
    expect(entry.action.prompt).toContain('docs/kiro-journal.md');
  });

  it('matchers behave on example paths', () => {
    const run = matcherOf('run-tests');
    const rule = matcherOf('rule-tests');
    const a11y = matcherOf('a11y-check');
    for (const p of ['src/App.tsx', 'src\\components\\X.tsx', 'D:\\code\\app\\src\\a.ts']) expect(run.test(p), p).toBe(true);
    for (const p of ['tests/x.ts', 'mysrc/a.ts', 'src/a.css']) expect(run.test(p), p).toBe(false);
    for (const p of ['src/detection/rules/kyc.ts', 'd:\\x\\src\\detection\\rules\\kyc.ts']) expect(rule.test(p), p).toBe(true);
    for (const p of ['src/detection/rules/kyc.test.ts', 'src/detection/rules/kyc.test.tsx', 'src/detection/engine.ts', 'src/detection/rules/sub/kyc.ts'])
      expect(rule.test(p), p).toBe(false);
    for (const p of ['src/App.tsx', 'src\\styles\\app.css', 'd:\\x\\src\\components\\Ghost.tsx']) expect(a11y.test(p), p).toBe(true);
    for (const p of ['src/App.test.tsx', 'src\\preferences.test.ts', 'src/preferences.ts']) expect(a11y.test(p), p).toBe(false);
  });

  // Shared path generators for the matcher properties.
  const segment = fc.stringMatching(/^[A-Za-z0-9_-]{1,8}$/).filter((s) => s !== 'src');
  const sep = fc.constantFrom('/', '\\');
  const dirs = fc.array(fc.tuple(segment, sep), { maxLength: 3 }).map((parts) => parts.map(([s, p]) => s + p).join(''));
  const prefix = fc.constantFrom('', 'D:\\code\\app\\', '/srv/app/');
  const baseName = fc.stringMatching(/^[A-Za-z0-9_-]{1,12}$/);

  // Feature: phantom-inbox-foundation, Property 7: The run-tests matcher accepts every TypeScript file under an src segment
  // Any .ts or .tsx path with an src segment matches, and paths without one or with other extensions do not.
  it('run-tests matcher property', () => {
    const re = matcherOf('run-tests');
    fc.assert(
      fc.property(prefix, dirs, sep, dirs, baseName, fc.constantFrom('.ts', '.tsx'), fc.constantFrom('.js', '.css', '.json', '.md'), (pre, d1, s, d2, name, ext, badExt) => {
        expect(re.test(`${pre}${d1}src${s}${d2}${name}${ext}`)).toBe(true);
        expect(re.test(`${pre}${d1}${d2}${name}${ext}`)).toBe(false);
        expect(re.test(`${pre}${d1}src${s}${d2}${name}${badExt}`)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: phantom-inbox-foundation, Property 8: The rule-tests matcher accepts rule files and never test files
  // Rule files directly in src/detection/rules match, while test files and files in other folders never match.
  it('rule-tests matcher property', () => {
    const re = matcherOf('rule-tests');
    fc.assert(
      fc.property(prefix, dirs, sep, sep, sep, segment, fc.stringMatching(/^[a-z0-9-]{1,12}$/), (pre, d, s1, s2, s3, sub, name) => {
        const rules = `${pre}${d}src${s1}detection${s2}rules${s3}`;
        expect(re.test(`${rules}${name}.ts`)).toBe(true);
        expect(re.test(`${rules}${name}.test.ts`)).toBe(false);
        expect(re.test(`${rules}${name}.test.tsx`)).toBe(false);
        expect(re.test(`${rules}${sub}${s3}${name}.ts`)).toBe(false);
        expect(re.test(`${pre}${d}src${s1}detection${s2}${name}.ts`)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: phantom-inbox-foundation, Property 9: The a11y-check matcher accepts UI files and never test files
  // Any .tsx or .css file under src matches, and any path ending in .test.ts or .test.tsx never matches.
  it('a11y-check matcher property', () => {
    const re = matcherOf('a11y-check');
    fc.assert(
      fc.property(prefix, dirs, sep, dirs, baseName, (pre, d1, s, sub, base) => {
        const under = `${pre}${d1}src${s}${sub}`;
        expect(re.test(`${under}${base}.tsx`)).toBe(true);
        expect(re.test(`${under}${base}.css`)).toBe(true);
        expect(re.test(`${under}${base}.test.ts`)).toBe(false);
        expect(re.test(`${under}${base}.test.tsx`)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------- Journal ----------
describe('journal', () => {
  const text = read('docs/kiro-journal.md');
  const lines = text.split(/\r?\n/);

  it('starts with the only level-1 heading', () => {
    const first = lines.find((l) => l.trim() !== '');
    expect(first?.startsWith('# ')).toBe(true);
    expect(lines.filter((l) => /^# /.test(l)).length).toBe(1);
  });

  it('has a short purpose paragraph', () => {
    const start = lines.findIndex((l) => l.startsWith('# ')) + 1;
    const end = lines.findIndex((l) => l.startsWith('- '));
    const para = lines.slice(start, end === -1 ? undefined : end).join(' ').trim();
    expect(para.length).toBeGreaterThan(0);
    expect(para.split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(sentenceCount(para)).toBeGreaterThanOrEqual(1);
    expect(sentenceCount(para)).toBeLessThanOrEqual(3);
  });

  it('every entry line matches "- YYYY-MM-DD | feature | 1 to 2 sentences"', () => {
    for (const line of lines.filter((l) => l.startsWith('- '))) {
      expect(isValidEntryLine(line), `invalid journal entry: ${line}`).toBe(true);
    }
  });

  it.each(['Specs', 'Steering', 'Hooks'])('has a seed entry for %s', (feature) => {
    expect(lines.some((l) => parseEntryLine(l)?.feature === feature)).toBe(true);
  });

  // Feature: phantom-inbox-foundation, Property 10: Journal entry lines round-trip and malformed lines are rejected
  // A formatted entry always parses back to itself, and the same line with a broken field or date is rejected.
  it('entry lines round-trip and malformed lines are rejected', () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = fc
      .tuple(fc.integer({ min: 2000, max: 2099 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
      .map(([y, m, d]) => `${y}-${pad(m)}-${pad(d)}`);
    const feature = fc.stringMatching(/^[A-Za-z][A-Za-z -]{0,18}[A-Za-z]$/);
    const sentence = fc.stringMatching(/^[A-Z][a-z ]{2,30}[a-z]\.$/);
    const description = fc.array(sentence, { minLength: 1, maxLength: 2 }).map((s) => s.join(' '));
    const entry = fc.record({ date, feature, description });

    fc.assert(
      fc.property(entry, (e) => {
        const line = formatEntryLine(e);
        expect(isValidEntryLine(line)).toBe(true);
        expect(parseEntryLine(line)).toEqual(e);
      }),
      { numRuns: 200 },
    );

    fc.assert(
      fc.property(entry, fc.constantFrom('extra', 'missing', 'slashes', 'shortYear'), (e, broken) => {
        const [y, m, d] = e.date.split('-');
        const bad =
          broken === 'extra'
            ? `${formatEntryLine(e)} | more`
            : broken === 'missing'
              ? `- ${e.date} | ${e.feature}`
              : broken === 'slashes'
                ? formatEntryLine({ ...e, date: `${y}/${m}/${d}` })
                : formatEntryLine({ ...e, date: `${y.slice(2)}-${m}-${d}` });
        expect(isValidEntryLine(bad), bad).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------- License, package, configs ----------
describe('license and package', () => {
  it('LICENSE has the copyright line right before the permission grant', () => {
    expect(exists('LICENSE'), 'LICENSE is missing').toBe(true);
    const lines = read('LICENSE').split(/\r?\n/);
    const i = lines.indexOf('Copyright (c) 2026 Phantom Inbox contributors');
    expect(i, 'LICENSE: copyright line missing').toBeGreaterThanOrEqual(0);
    const next = lines.slice(i + 1).find((l) => l.trim() !== '');
    expect(next?.startsWith('Permission is hereby granted'), 'LICENSE: permission grant must follow').toBe(true);
    expect(read('LICENSE')).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
  });

  it('package.json license field is MIT', () => {
    expect(JSON.parse(read('package.json')).license, 'package.json license field').toBe('MIT');
  });

  it('every dependency is pinned to an exact version', () => {
    const pkg = JSON.parse(read('package.json')) as Record<string, Record<string, string> | undefined>;
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(all)) {
      expect(version, `${name} is not pinned`).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('tsconfig is strict and vite uses a relative base', () => {
    expect(JSON.parse(read('tsconfig.json')).compilerOptions.strict).toBe(true);
    expect(read('vite.config.ts')).toContain("base: './'");
  });
});

describe('README', () => {
  const doc = read('README.md');
  const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>;

  it.each([
    ['pitch', 'Every scam has a ghost hiding in it. Phantom Inbox makes it visible.'],
    ['privacy: runs in the browser', 'Everything runs in your browser.'],
    ['privacy: nothing stored or sent', 'No message is stored or sent anywhere.'],
    ['certainty', 'never 100% certain'],
    ['not a guarantee', 'not a guarantee'],
    ['MIT', 'MIT'],
    ['LICENSE link', '[LICENSE](LICENSE)'],
  ])('README contains %s', (label, phrase) => {
    expect(doc.includes(phrase), `README: missing ${label}`).toBe(true);
  });

  it.each(['Possession Check', 'Exorcism', 'S\u00e9ance'])('README marks %s as available or planned', (feature) => {
    expect(doc.split(/\r?\n/).some((l) => l.includes(feature) && /\((available|planned)\)/.test(l)), `README: ${feature}`).toBe(true);
  });

  it('README commands exist in package.json', () => {
    expect(doc).toContain('npm install');
    expect(doc).toContain('npm test');
    expect(scripts.test).toBe('vitest --run');
    const runs = [...doc.matchAll(/npm run ([a-z]+)/g)].map((m) => m[1]);
    expect(new Set(runs)).toEqual(new Set(['dev', 'build', 'preview']));
    for (const name of runs) expect(scripts[name], `README: unknown script ${name}`).toBeDefined();
  });

  it('every relative link target exists', () => {
    for (const [, target] of doc.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(https?:|#|mailto:)/.test(target)) continue;
      expect(exists(target), `README: broken link ${target}`).toBe(true);
    }
  });
});

describe('.gitignore', () => {
  const lines = read('.gitignore').split(/\r?\n/).map((l) => l.trim());
  it.each(['node_modules/', 'dist/', 'coverage/', '.env', '.env.*', '*.log', '*-done.txt', 'checks.txt', '*.bak', '.vscode/', 'Thumbs.db', '.DS_Store', 'test-results/'])('ignores %s', (entry) => {
    expect(lines).toContain(entry);
  });
  it('never ignores .kiro', () => {
    for (const line of lines.filter((l) => l && !l.startsWith('#'))) {
      expect(line.includes('.kiro'), `.gitignore line ignores .kiro: ${line}`).toBe(false);
    }
  });
});

// ---------- Source scan ----------
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && name !== 'test-setup.ts') out.push(full);
  }
  return out;
}

describe('source scan', () => {
  const files = sourceFiles(join(ROOT, 'src'));

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.slice(ROOT.length + 1), f]))('%s makes no network calls and renders no raw HTML', (_rel, full) => {
    const code = readFileSync(full, 'utf8');
    for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /\bWebSocket\b/, /\bEventSource\b/, /sendBeacon/, /dangerouslySetInnerHTML/, /\.innerHTML\s*=/]) {
      expect(pattern.test(code), `${full}: forbidden ${pattern}`).toBe(false);
    }
  });

  it('the app shell does not import the detection engine', () => {
    const shell = files.filter((f) => /[/\\](App\.tsx|main\.tsx|preferences\.ts|useSystemReducedMotion\.ts)$/.test(f) || /[/\\]components[/\\]/.test(f));
    for (const f of shell) {
      const imports = [...readFileSync(f, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
      expect(imports.some((i) => i.includes('detection')), `${f} imports detection`).toBe(false);
    }
  });
});
describe('third-party licences', () => {
  const doc = read('README.md');
  it.each([
    ['Creepster', 'public/licenses/creepster-OFL.txt'],
    ['tesseract.js', 'public/licenses/tesseract.js-Apache-2.0.txt'],
    ['tesseract.js-core', 'public/licenses/tesseract.js-core-Apache-2.0.txt'],
    ['English language data', 'public/licenses/tesseract-eng-data.txt'],
  ])('README lists %s and its licence file ships in the build', (name, file) => {
    expect(doc.includes(name), `README: missing ${name}`).toBe(true);
    expect(doc.includes(`(${file})`), `README: no link to ${file}`).toBe(true);
    expect(exists(file), `${file} is missing`).toBe(true);
  });

  it('serves every OCR asset from a file that exists in node_modules', async () => {
    const { OCR_ASSETS } = await import('../ocr-assets');
    for (const asset of OCR_ASSETS) {
      expect(asset.path.startsWith('ocr/'), asset.path).toBe(true);
      expect(exists(`node_modules/${asset.source}`), `missing node_modules/${asset.source}`).toBe(true);
    }
  });
});