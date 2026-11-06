import type { AnchorLink, Link } from './types';

/** Endings accepted for links written without http:// (keeps "Mr.Mehta" from being a link). */
const KNOWN_TLDS = new Set([
  'com', 'net', 'org', 'in', 'co', 'io', 'info', 'biz', 'me', 'app', 'dev', 'ai', 'us', 'uk',
  'xyz', 'top', 'click', 'link', 'buzz', 'live', 'icu', 'work', 'rest', 'cam', 'sbs', 'cfd',
  'support', 'loan', 'tk', 'ml', 'ga', 'cf', 'gq', 'win', 'bid', 'cyou', 'site', 'online',
  'store', 'shop', 'club', 'ly', 'gl', 'gd', 'at', 'cc', 'sbi', 'bank', 'example', 'gov', 'id',
]);

/** Second-level labels used under two-letter country endings, such as co.in or gov.in. */
const SECOND_LEVEL = new Set(['co', 'com', 'net', 'org', 'gov', 'ac', 'edu', 'nic', 'res', 'gen', 'firm', 'ind', 'bank']);

const SCHEME_URL = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const BARE_IP = /(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:\/[^\s<>"'`]*)?/g;
const BARE_DOMAIN =
  /(?<![@\w.\-/\\])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,24}(?::\d{2,5})?(?:\/[^\s<>"'`]*)?/giu;
const TRAILING = /[.,;:!?)\]}'"]+$/;

export function isIpHost(host: string): boolean {
  if (/^\[[0-9a-f:.]+\]$/i.test(host)) {
    return true;
  }
  const parts = host.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** Splits a URL into its host and the host's offset inside the URL, without ever throwing. */
export function parseHost(url: string): { host: string; offset: number } {
  const scheme = /^[a-z][a-z0-9+.-]*:\/\//i.exec(url);
  let offset = scheme ? scheme[0].length : 0;
  let authority = url.slice(offset).split(/[/?#]/, 1)[0];
  const at = authority.lastIndexOf('@');
  if (at >= 0) {
    offset += at + 1;
    authority = authority.slice(at + 1);
  }
  let host = authority;
  if (host.startsWith('[')) {
    const close = host.indexOf(']');
    host = close >= 0 ? host.slice(0, close + 1) : host;
  } else {
    const colon = host.indexOf(':');
    if (colon >= 0) {
      host = host.slice(0, colon);
    }
  }
  return { host: host.replace(/\.$/, ''), offset };
}

/** Number of labels that form the public ending, for example 1 for "com" and 2 for "co.in". */
export function suffixLabelCount(labels: readonly string[]): number {
  const n = labels.length;
  if (n >= 3 && labels[n - 1].length === 2 && SECOND_LEVEL.has(labels[n - 2])) {
    return 2;
  }
  return 1;
}

/** The part of a host that an organisation registers, such as "examplebank.co.in". */
export function registrableDomain(host: string): string {
  const lower = host.toLowerCase().replace(/\.$/, '');
  if (isIpHost(lower)) {
    return lower;
  }
  const labels = lower.split('.');
  const keep = suffixLabelCount(labels) + 1;
  return labels.slice(-keep).join('.');
}

export function topLevelDomain(host: string): string {
  const labels = host.toLowerCase().split('.');
  return labels[labels.length - 1] ?? '';
}

function toLink(url: string, start: number): Link | undefined {
  const { host, offset } = parseHost(url);
  if (host === '') {
    return undefined;
  }
  const hostStart = start + offset;
  return { url, start, end: start + url.length, host, hostStart, hostEnd: hostStart + host.length };
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Finds web links in plain text: http(s) links, bare IP links and bare domains with a known ending. */
export function findLinks(text: string, base = 0): Link[] {
  const links: Link[] = [];
  const add = (raw: string, index: number, requireKnownTld: boolean) => {
    const url = raw.replace(TRAILING, '');
    if (url.length === 0) {
      return;
    }
    const link = toLink(url, base + index);
    if (!link || links.some((l) => overlaps(l, link))) {
      return;
    }
    if (requireKnownTld && !KNOWN_TLDS.has(topLevelDomain(link.host))) {
      return;
    }
    links.push(link);
  };
  for (const m of text.matchAll(SCHEME_URL)) add(m[0], m.index, false);
  for (const m of text.matchAll(BARE_IP)) {
    if (isIpHost(parseHost(m[0].replace(TRAILING, '')).host)) add(m[0], m.index, false);
  }
  for (const m of text.matchAll(BARE_DOMAIN)) add(m[0], m.index, true);
  return links.sort((a, b) => a.start - b.start);
}

const HTML_ANCHOR = /<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>/dgi;
const MARKDOWN_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/dgi;
const ANGLE_LINK = /(\S+)[ \t]*<(https?:\/\/[^>\s]+)>/dgi;

function anchor(hrefValue: string, hrefStart: number, textStart: number, textEnd: number, text: string): AnchorLink | undefined {
  if (!/^https?:\/\//i.test(hrefValue)) {
    return undefined;
  }
  const href = toLink(hrefValue, hrefStart);
  if (!href) {
    return undefined;
  }
  // Trim whitespace around the visible text.
  let s = textStart;
  let e = textEnd;
  while (s < e && /\s/.test(text[s])) s += 1;
  while (e > s && /\s/.test(text[e - 1])) e -= 1;
  return { textStart: s, textEnd: e, href };
}

/** Finds links whose visible text is separate from where they go: HTML, Markdown and "text <url>". */
export function findAnchors(text: string): AnchorLink[] {
  const anchors: AnchorLink[] = [];
  for (const m of text.matchAll(HTML_ANCHOR)) {
    const [hrefRange, textRange] = [m.indices?.[2], m.indices?.[3]];
    if (hrefRange && textRange) {
      const a = anchor(m[2], hrefRange[0], textRange[0], textRange[1], text);
      if (a) anchors.push(a);
    }
  }
  for (const pattern of [MARKDOWN_LINK, ANGLE_LINK]) {
    for (const m of text.matchAll(pattern)) {
      const [textRange, hrefRange] = [m.indices?.[1], m.indices?.[2]];
      if (hrefRange && textRange) {
        const a = anchor(m[2], hrefRange[0], textRange[0], textRange[1], text);
        if (a) anchors.push(a);
      }
    }
  }
  return anchors.sort((a, b) => a.textStart - b.textStart);
}