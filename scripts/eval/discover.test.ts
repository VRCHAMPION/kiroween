// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverFiles } from './discover';

let dir = '';
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('discoverFiles', () => {
  it('lists regular files, skips the cmds index and keeps names without extensions', () => {
    dir = mkdtempSync(join(tmpdir(), 'eval-'));
    writeFileSync(join(dir, '00001.abcdef'), 'x');
    writeFileSync(join(dir, 'mbox'), 'x');
    writeFileSync(join(dir, 'cmds'), 'x');
    const found = discoverFiles(dir);
    expect(found.files.map((f) => f.slice(dir.length + 1))).toEqual(['00001.abcdef', 'mbox']);
    expect(found.skipped).toEqual([{ file: 'cmds', reason: 'corpus index file' }]);
  });
});