import { findAnchors, findLinks } from './links';
import type { AnalysisInput, Link, PreparedInput } from './types';

/** Turns header records into "Name: value" lines; raw header text is kept as it is. */
export function headerTextOf(headers: AnalysisInput['headers']): string {
  if (headers === undefined) {
    return '';
  }
  if (typeof headers === 'string') {
    return headers;
  }
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
}

export function prepare(input: AnalysisInput): PreparedInput {
  const text = typeof input.text === 'string' ? input.text : '';
  const anchors = findAnchors(text);
  const links: Link[] = findLinks(text);
  for (const a of anchors) {
    if (!links.some((l) => l.start === a.href.start && l.end === a.href.end)) {
      links.push(a.href);
    }
  }
  links.sort((a, b) => a.start - b.start);
  return {
    text,
    headerText: headerTextOf(input.headers),
    attachments: [...(input.attachments ?? [])],
    links,
    anchors,
  };
}