import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * jsdom does no layout, so the 360px phone layout is guarded by reading the CSS itself.
 * Found in a real browser: a grid whose column is `auto` or `1fr` grows to its widest unbreakable
 * word, so the whole page became wider than a 360px phone. Every grid column must be able to shrink.
 */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return name.endsWith('.css') ? [path] : [];
  });
}

interface Rule {
  file: string;
  selector: string;
  body: string;
}

function rules(): Rule[] {
  const found: Rule[] = [];
  for (const file of cssFiles(SRC)) {
    const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      found.push({ file: file.slice(SRC.length + 1), selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] });
    }
  }
  return found;
}

const all = rules();
const grids = all.filter((r) => /display:\s*grid\b/.test(r.body) && !r.selector.startsWith('@'));
const columnsOf = (body: string) => /grid-template-columns:\s*([^;]+);/.exec(body)?.[1].trim();

describe('360px layout: grids can shrink', () => {
  it('finds the grid rules', () => {
    expect(grids.length).toBeGreaterThan(10);
  });

  it.each(grids.map((r) => [`${r.file}: ${r.selector}`, r] as const))('%s has columns that can shrink', (_name, rule) => {
    // Decorative drawing grids that use fixed sizes are the only ones allowed to skip this.
    const columns = columnsOf(rule.body);
    expect(columns, 'declare grid-template-columns: minmax(0, 1fr)').toBeDefined();
    const bare = (columns ?? '').replace(/minmax\([^)]*\)/g, '').replace(/max-content/g, '');
    expect(bare, `bare track in "${columns}"`).not.toMatch(/\b(auto|\d*\.?\d*fr)\b/);
  });

  it('any wider-screen grid override also keeps shrinkable columns', () => {
    for (const rule of all) {
      const columns = columnsOf(rule.body);
      if (!columns) continue;
      const bare = columns.replace(/minmax\([^)]*\)/g, '').replace(/max-content/g, '');
      expect(bare, `${rule.file}: ${rule.selector} uses "${columns}"`).not.toMatch(/\b(auto|\d*\.?\d*fr)\b/);
    }
  });
});

describe('360px layout: tap targets', () => {
  it('the "I have read this step" checkbox is at least 44px', () => {
    const rule = all.find((r) => r.selector === '.ritual-check input' && /width:/.test(r.body));
    expect(rule, 'rule for .ritual-check input').toBeDefined();
    expect(Number(/(?:^|[;\s])width:\s*(\d+)px/.exec(rule?.body ?? '')?.[1])).toBeGreaterThanOrEqual(44);
    expect(Number(/(?:^|[;\s])height:\s*(\d+)px/.exec(rule?.body ?? '')?.[1])).toBeGreaterThanOrEqual(44);
  });

  it('the footer note box is at least 44px high', () => {
    const rule = all.find((r) => r.selector === '.app-footer');
    expect(Number(/min-height:\s*(\d+)px/.exec(rule?.body ?? '')?.[1])).toBeGreaterThanOrEqual(44);
  });
});
