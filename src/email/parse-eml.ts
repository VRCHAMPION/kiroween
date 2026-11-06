/** Reads a saved email (.eml, RFC 5322 with MIME parts) entirely from a string. No DOM, no network. */

export interface ParsedEmail {
  /** Kept headers, unfolded and decoded. Repeated headers are joined with a new line. */
  headers: Record<string, string>;
  /** The kept headers as "Name: value" lines, in file order. */
  headerText: string;
  subject: string;
  from: string;
  /** Message text: the HTML part converted to text (links as "text <url>"), or the plain-text part. */
  body: string;
  links: string[];
  attachments: string[];
}

export class EmlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmlParseError';
  }
}

const KEPT_HEADERS = [
  'from', 'reply-to', 'return-path', 'sender', 'to', 'subject', 'date',
  'authentication-results', 'arc-authentication-results', 'received-spf',
];

interface HeaderField {
  name: string;
  value: string;
}

interface Part {
  headers: HeaderField[];
  body: string;
}

function splitHeadersAndBody(raw: string): Part {
  const breakAt = raw.indexOf('\n\n');
  const headerBlock = breakAt === -1 ? raw : raw.slice(0, breakAt);
  const body = breakAt === -1 ? '' : raw.slice(breakAt + 2);
  const unfolded = headerBlock.replace(/\n[ \t]+/g, ' ');
  const headers: HeaderField[] = [];
  for (const line of unfolded.split('\n')) {
    const colon = line.indexOf(':');
    if (colon > 0 && /^[!-9;-~]+$/.test(line.slice(0, colon))) {
      headers.push({ name: line.slice(0, colon), value: line.slice(colon + 1).trim() });
    }
  }
  return { headers, body };
}

function header(part: Part, name: string): string {
  return part.headers.find((h) => h.name.toLowerCase() === name)?.value ?? '';
}

function decodeBytes(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset || 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function base64Bytes(value: string): Uint8Array | undefined {
  try {
    const binary = atob(value.replace(/[^A-Za-z0-9+/=]/g, ''));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

function quotedPrintableBytes(value: string, underscoreIsSpace = false): Uint8Array {
  const text = value.replace(/=\n/g, '');
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '=' && /^[0-9A-Fa-f]{2}$/.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (underscoreIsSpace && ch === '_') {
      bytes.push(0x20);
    } else {
      bytes.push(...encoder.encode(ch));
    }
  }
  return Uint8Array.from(bytes);
}

/** Decodes RFC 2047 encoded words such as =?UTF-8?B?...?= in header values. */
export function decodeEncodedWords(value: string): string {
  return value
    .replace(/(=\?[^?]+\?[BbQq]\?[^?]*\?=)\s+(?==\?)/g, '$1')
    .replace(/=\?([^?*]+)(?:\*[^?]*)?\?([BbQq])\?([^?]*)\?=/g, (_all, charset: string, kind: string, data: string) => {
      const bytes = kind.toUpperCase() === 'B' ? base64Bytes(data) : quotedPrintableBytes(data, true);
      return bytes ? decodeBytes(bytes, charset) : data;
    });
}

function percentBytes(text: string): Uint8Array {
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '%' && /^[0-9A-Fa-f]{2}$/.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(...encoder.encode(text[i]));
    }
  }
  return Uint8Array.from(bytes);
}

/** Reads a parameter such as boundary or filename, including RFC 2231 forms. */function param(value: string, name: string): string {
  const lower = name.toLowerCase();
  const pieces: { index: number; text: string; encoded: boolean }[] = [];
  let plain = '';
  for (const m of value.matchAll(/;\s*([^=\s;]+)\s*=\s*("(?:[^"\\]|\\.)*"|[^;]*)/g)) {
    const key = m[1].toLowerCase();
    let text = m[2].trim();
    if (text.startsWith('"')) text = text.slice(1, -1).replace(/\\(.)/g, '$1');
    if (key === lower) {
      plain = text;
    } else if (key.startsWith(`${lower}*`)) {
      const rest = key.slice(lower.length + 1);
      const encoded = rest.endsWith('*') || rest === '';
      const index = parseInt(rest, 10);
      pieces.push({ index: Number.isNaN(index) ? 0 : index, text, encoded });
    }
  }
  if (pieces.length > 0) {
    pieces.sort((a, b) => a.index - b.index);
    let charset = 'utf-8';
    const bytes: number[] = [];
    pieces.forEach((p, i) => {
      let text = p.text;
      if (i === 0 && p.encoded) {
        const m = /^([^']*)'[^']*'(.*)$/.exec(text);
        if (m) {
          charset = m[1] || charset;
          text = m[2];
        }
      }
      bytes.push(...(p.encoded ? percentBytes(text) : new TextEncoder().encode(text)));
    });
    return decodeBytes(Uint8Array.from(bytes), charset);
  }
  return decodeEncodedWords(plain);
}

function decodeBody(part: Part): string {
  return decodeBodyRaw(part).replace(/\r\n?/g, '\n');
}

function decodeBodyRaw(part: Part): string {
  const encoding = header(part, 'content-transfer-encoding').toLowerCase();
  const charset = param(header(part, 'content-type'), 'charset') || 'utf-8';
  if (encoding === 'base64') {
    const bytes = base64Bytes(part.body);
    return bytes ? decodeBytes(bytes, charset) : part.body;
  }
  if (encoding === 'quoted-printable') {
    return decodeBytes(quotedPrintableBytes(part.body), charset);
  }
  return part.body;
}

const ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (all, name: string) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return ENTITIES[lower] ?? all;
  });
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

/** Converts email HTML to readable text. Links become "text <url>" so link tricks stay visible. */
export function htmlToText(html: string): string {
  // Converted links are parked behind placeholders so tag stripping cannot remove "<url>".
  const links: string[] = [];
  const park = (value: string) => `\uE000${links.push(value) - 1}\uE001`;
  let text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|head|title)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/gi, (_all, _q: string, href: string, inner: string) => {
      const url = decodeEntities(href.trim());
      const label = decodeEntities(stripTags(inner)).replace(/\s+/g, ' ').trim();
      if (!/^https?:\/\//i.test(url)) return label;
      return park(label === '' || label === url ? url : `${label} <${url}>`);
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|tr|li|h[1-6]|table|ul|ol|blockquote)\s*>/gi, '\n');
  text = decodeEntities(stripTags(text)).replace(/\uE000(\d+)\uE001/g, (_m, i: string) => links[Number(i)] ?? '');
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface Collected {
  plain: string[];
  html: string[];
  attachments: string[];
}

function walk(part: Part, out: Collected, depth: number): void {
  const type = header(part, 'content-type').toLowerCase();
  const disposition = header(part, 'content-disposition');
  const name = param(disposition, 'filename') || param(header(part, 'content-type'), 'name');
  if (/^attachment\b/i.test(disposition) || (name !== '' && !type.startsWith('multipart/'))) {
    out.attachments.push(name || 'unnamed attachment');
    return;
  }
  if (type.startsWith('multipart/') && depth < 10) {
    const boundary = param(header(part, 'content-type'), 'boundary');
    if (boundary === '') return;
    const marker = `--${boundary}`;
    const chunks = part.body.split('\n');
    let current: string[] | undefined;
    for (const line of chunks) {
      if (line.trimEnd() === `${marker}--`) {
        if (current) walk(splitHeadersAndBody(current.join('\n')), out, depth + 1);
        current = undefined;
        break;
      }
      if (line.trimEnd() === marker) {
        if (current) walk(splitHeadersAndBody(current.join('\n')), out, depth + 1);
        current = [];
      } else if (current) {
        current.push(line);
      }
    }
    if (current) walk(splitHeadersAndBody(current.join('\n')), out, depth + 1);
    return;
  }
  if (type.startsWith('message/rfc822')) {
    out.attachments.push('attached email');
    return;
  }
  if (type === '' || type.startsWith('text/plain')) {
    out.plain.push(decodeBody(part));
  } else if (type.startsWith('text/html')) {
    out.html.push(decodeBody(part));
  }
}

const LINK = /\bhttps?:\/\/[^\s<>"'`]+/gi;

export function parseEml(raw: string): ParsedEmail {
  const normalised = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const top = splitHeadersAndBody(normalised);
  if (top.headers.length === 0 || !/^[!-9;-~]+:/.test(normalised)) {
    throw new EmlParseError('This file does not look like a saved email.');
  }
  const kept = top.headers
    .filter((h) => KEPT_HEADERS.includes(h.name.toLowerCase()))
    .map((h) => ({ name: h.name, value: decodeEncodedWords(h.value) }));
  const headers: Record<string, string> = {};
  for (const h of kept) {
    headers[h.name] = headers[h.name] === undefined ? h.value : `${headers[h.name]}\n${h.value}`;
  }
  const collected: Collected = { plain: [], html: [], attachments: [] };
  walk(top, collected, 0);
  const htmlText = collected.html.map(htmlToText).join('\n\n').trim();
  const plainText = collected.plain.join('\n\n').trim();
  const body = htmlText !== '' ? htmlText : plainText;
  const links = [...new Set([...body.matchAll(LINK)].map((m) => m[0].replace(/[.,;:!?)\]}'">]+$/, '')))];
  return {
    headers,
    headerText: kept.map((h) => `${h.name}: ${h.value}`).join('\n'),
    subject: kept.find((h) => h.name.toLowerCase() === 'subject')?.value ?? '',
    from: kept.find((h) => h.name.toLowerCase() === 'from')?.value ?? '',
    body,
    links,
    attachments: collected.attachments,
  };
}