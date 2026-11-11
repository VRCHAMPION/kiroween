import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export interface Discovered {
  files: string[];
  skipped: Array<{ file: string; reason: string }>;
}

/** Every regular file in a folder (not recursive), sorted. Corpus index files named "cmds" and files over 20 MB are skipped. */
export function discoverFiles(dir: string): Discovered {
  const files: string[] = [];
  const skipped: Discovered['skipped'] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const info = statSync(full);
    if (!info.isFile()) continue;
    if (name === 'cmds') skipped.push({ file: name, reason: 'corpus index file' });
    else if (info.size > MAX_FILE_BYTES) skipped.push({ file: name, reason: 'larger than 20 MB' });
    else files.push(full);
  }
  return { files, skipped };
}