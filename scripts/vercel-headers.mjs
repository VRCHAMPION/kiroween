/**
 * Reads the response headers from vercel.json so local servers (vite preview, the browser check
 * scripts) send exactly what the hosted site sends. Only the simple source patterns this project
 * uses are supported: literal text and (.*).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** vercel.json, or the file named by VERCEL_CONFIG (used to test a changed configuration). */
export function readVercelConfig() {
  const file = process.env.VERCEL_CONFIG || join(ROOT, 'vercel.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** A vercel.json header source as a RegExp for the whole path. Throws for patterns we do not support. */
export function sourceToRegExp(source) {
  if (/[:?+{}[\]]/.test(source.replace(/\\\./g, '').replace(/\(\.\*\)/g, ''))) {
    throw new Error(`Unsupported vercel.json source pattern: ${source}`);
  }
  return new RegExp(`^${source}$`);
}

/** The [name, value] headers for a path. When several rules set the same header, the last one wins. */
export function headersFor(pathname, config = readVercelConfig()) {
  const merged = new Map();
  for (const rule of config.headers ?? []) {
    if (!sourceToRegExp(rule.source).test(pathname)) continue;
    for (const { key, value } of rule.headers) merged.set(key.toLowerCase(), [key, value]);
  }
  return [...merged.values()];
}

/** Response headers for a static file: its content type, then every header the hosting rules add. */
export function responseHeaders(pathname, contentType, config = readVercelConfig()) {
  const out = { 'content-type': contentType };
  for (const [key, value] of headersFor(pathname, config)) out[key.toLowerCase()] = value;
  return out;
}
