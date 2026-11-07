import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from './contrast';

type View = 'mortal' | 'haunted';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tokens.css'), 'utf8');

function parseTokens(view: View): Record<string, string> {
  const block = new RegExp(`\\[data-view='${view}'\\]\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) {
    throw new Error(`tokens.css has no block for ${view}`);
  }
  const tokens: Record<string, string> = {};
  for (const line of block[1].split(';')) {
    const m = /^\s*(--[a-z0-9-]+)\s*:\s*(.+?)\s*$/s.exec(line);
    if (m) {
      tokens[m[1]] = m[2];
    }
  }
  return tokens;
}

const REQUIRED = [
  '--color-bg',
  '--color-surface',
  '--color-text',
  '--color-text-muted',
  '--color-accent-flag',
  '--color-border',
  '--color-focus',
  '--color-verdict-scam',
  '--color-verdict-suspicious',
  '--color-verdict-safe',
  '--color-highlight',
  '--font-family',
  '--font-size-body',
  '--font-size-heading',
  '--focus-width',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--font-family-heading',
  '--color-ghost',
  '--color-ghost-ink',
  '--color-ghost-warn',
  '--color-candle',
  '--candle-glow-strength',
  '--color-wax',
  '--color-sky-top',
  '--color-sky-bottom',
  '--color-mansion',
  '--color-moon',
  '--color-fog',
  '--fog-strength',
];

const TEXT_PAIRS: [string, string][] = [
  ['--color-text', '--color-bg'],
  ['--color-text', '--color-surface'],
  ['--color-text-muted', '--color-bg'],
  ['--color-text-muted', '--color-surface'],
  ['--color-accent-flag', '--color-bg'],
  ['--color-accent-flag', '--color-surface'],
  ['--color-text', '--color-highlight'],
  ['--color-ghost-ink', '--color-ghost'],
  ['--color-ghost', '--color-ghost-ink'],
  ['--color-ghost-warn', '--color-ghost'],
];

const BOUNDARY_PAIRS: [string, string][] = [
  ['--color-border', '--color-bg'],
  ['--color-border', '--color-surface'],
  ['--color-focus', '--color-bg'],
  ['--color-focus', '--color-surface'],
  ['--color-verdict-scam', '--color-bg'],
  ['--color-verdict-scam', '--color-surface'],
  ['--color-verdict-suspicious', '--color-bg'],
  ['--color-verdict-suspicious', '--color-surface'],
  ['--color-verdict-safe', '--color-bg'],
  ['--color-verdict-safe', '--color-surface'],
  ['--color-bg', '--color-verdict-scam'],
  ['--color-bg', '--color-verdict-suspicious'],
  ['--color-bg', '--color-verdict-safe'],
  ['--color-bg', '--color-text'],
  ['--color-ghost', '--color-bg'],
  ['--color-ghost', '--color-surface'],
  ['--color-ghost', '--color-highlight'],
  ['--color-wax', '--color-bg'],
  ['--color-focus', '--color-ghost-ink'],
  ['--color-ghost-ink', '--color-ghost'],
];

const px = (value: string) => parseFloat(value.replace('px', ''));

describe.each<View>(['mortal', 'haunted'])('design tokens: %s view', (view) => {
  const tokens = parseTokens(view);

  it.each(REQUIRED)('declares %s', (name) => {
    expect(tokens[name], `${view}: missing ${name}`).toBeTruthy();
  });

  it('has a large enough body size', () => {
    expect(px(tokens['--font-size-body'])).toBeGreaterThanOrEqual(view === 'mortal' ? 18 : 16);
  });

  it('has a focus width of at least 2px', () => {
    expect(px(tokens['--focus-width'])).toBeGreaterThanOrEqual(2);
  });

  it.each(TEXT_PAIRS)('text pair %s on %s is at least 4.5:1', (fg, bg) => {
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    expect(ratio, `${view}: ${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BOUNDARY_PAIRS)('boundary pair %s on %s is at least 3:1', (fg, bg) => {
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    expect(ratio, `${view}: ${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
  });
});
/** Mixes `amount` (0 to 1) of colour `b` into colour `a`, like CSS color-mix in sRGB. */
function blend(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return '#' + [mix(ar, br), mix(ag, bg), mix(ab, bb)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const percent = (value: string) => parseFloat(value.replace('%', '')) / 100;

describe.each<View>(['mortal', 'haunted'])('candle glow at full strength: %s view', (view) => {
  const tokens = parseTokens(view);
  const strength = percent(tokens['--candle-glow-strength']);

  it('has a glow strength between 0% and 20%', () => {
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(0.2);
  });

  // Panels in Haunted view use surface or bg; the glow tints them from the top corner.
  describe.each(['--color-surface', '--color-bg'])('on %s', (panel) => {
    const lit = blend(tokens[panel], tokens['--color-candle'], strength);

    it.each(['--color-text', '--color-text-muted', '--color-accent-flag'])('%s keeps 4.5:1', (fg) => {
      const ratio = contrastRatio(tokens[fg], lit);
      expect(ratio, `${view}: ${fg} on candle-lit ${panel} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    });

    it.each(['--color-border', '--color-focus', '--color-verdict-scam', '--color-verdict-suspicious', '--color-verdict-safe', '--color-ghost'])(
      '%s keeps 3:1',
      (fg) => {
        const ratio = contrastRatio(tokens[fg], lit);
        expect(ratio, `${view}: ${fg} on candle-lit ${panel} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
      },
    );
  });
});

describe('haunted heading font', () => {
  it('uses Creepster for headings in Haunted view and the body font in Mortal view', () => {
    expect(parseTokens('haunted')['--font-family-heading']).toMatch(/^'Creepster'/);
    expect(parseTokens('mortal')['--font-family-heading']).toBe(parseTokens('mortal')['--font-family']);
  });
});