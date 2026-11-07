import { findBrandLookalike, type LookalikeMatch } from '../brands';
import { makeFlag } from '../flag';
import type { FlagSource, RedFlag, Rule } from '../types';

const LABEL = 'Lookalike web address';

function reasonFor(match: LookalikeMatch, what: string): string {
  if (match.kind === 'foreign-script') {
    return `This ${what} mixes in letters from another alphabet that look like English letters.`;
  }
  const name = match.brand.name;
  return match.imitation
    ? `This ${what} imitates ${name} with look-alike characters, but it is not ${name}'s real website.`
    : `This ${what} uses the name ${name}, but it is not ${name}'s official website.`;
}

function flagFor(host: string, start: number, source: FlagSource, sourceText: string, what: string, destination?: string): RedFlag | undefined {
  const match = findBrandLookalike(host);
  if (!match) {
    return undefined;
  }
  return makeFlag(
    {
      type: 'lookalike-domain',
      label: LABEL,
      severity: match.kind === 'brand' ? 'high' : 'medium',
      reason: reasonFor(match, what),
      source,
      start,
      end: start + host.length,
      destination,
    },
    sourceText,
  );
}

const SENDER_LINE = /^(from|reply-to|return-path|sender)[ \t]*:[^\n]*$/gim;
const EMAIL_DOMAIN = /@([^\s>"';,)]+)/g;

export const lookalikeDomain: Rule = {
  id: 'lookalike-domain',
  check(input) {
    const flags: RedFlag[] = [];
    for (const link of input.links) {
      const flag = flagFor(link.host, link.hostStart, 'body', input.text, 'web address', link.url);
      if (flag) flags.push(flag);
    }
    for (const line of input.headerText.matchAll(SENDER_LINE)) {
      for (const m of line[0].matchAll(EMAIL_DOMAIN)) {
        const domain = m[1].replace(/\.$/, '');
        const start = line.index + m.index + 1;
        const flag = flagFor(domain, start, 'header', input.headerText, 'sender address');
        if (flag) flags.push(flag);
      }
    }
    return flags;
  },
};