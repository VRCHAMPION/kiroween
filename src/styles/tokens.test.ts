import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

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
  '--font-family',
  '--font-size-body',
  '--font-size-heading',
  '--focus-width',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
];

const TEXT_PAIRS: [string, string][] = [
  ['--color-text', '--color-bg'],
  ['--color-text', '--color-surface'],
  ['--color-text-muted', '--color-bg'],
  ['--color-text-muted', '--color-surface'],
  ['--color-accent-flag', '--color-bg'],
  ['--color-accent-flag', '--color-surface'],
];

const BOUNDARY_PAIRS: [string, string][] = [
  ['--color-border', '--color-bg'],
  ['--color-border', '--color-surface'],
  ['--color-focus', '--color-bg'],
  ['--color-focus', '--color-surface'],
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