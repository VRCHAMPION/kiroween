import { findBrandLookalike, type LookalikeMatch } from '../brands';
import { makeFlag } from '../flag';
import type { FlagSource, RedFlag, Rule } from '../types';

const LABEL = 'Lookalike web address';

/** Makes text from a stranger safe to show: control, invisible and direction-changing characters become U+XXXX, and long text is cut. */
export function plainHostText(text: string): string {
  const safe = [...text]
    .map((ch) => (/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(ch) ? `U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}` : ch))
    .join('');
  return safe.length > 80 ? `${safe.slice(0, 77)}...` : safe;
}

function reasonFor(match: LookalikeMatch, what: string, host: string): string {
  const decoded = 'decoded' in match && match.decoded ? ` The encoded name ${plainHostText(host)} reads as ${plainHostText(match.decoded)}.` : '';
  switch (match.kind) {
    case 'foreign-script':
      return match.undecodable
        ? `This ${what} uses an encoded name that could not be read, so check who sent it.`
        : `This ${what} mixes in letters from another alphabet that look like English letters.${decoded}`;
    case 'brand-in-subdomain':
      return `This ${what} puts ${match.brand.name}'s name in front of a different website (${plainHostText(match.registrable)}), so it may not be ${match.brand.name}.`;
    case 'homograph':
      return `This ${what} copies the name of ${match.domain} with look-alike letters, so it may not be that website.${decoded}`;
    case 'typosquat':
      return `This ${what} is a small spelling change away from ${match.domain}, so it may be an imitation of ${match.brandName ?? 'that site'}.${decoded}`;
    case 'brand': {
      const name = match.brand.name;
      return (match.imitation
        ? `This ${what} imitates ${name} with look-alike characters, but it is not ${name}'s real website.`
        : `This ${what} uses the name ${name}, but it is not ${name}'s official website.`) + decoded;
    }
  }
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
      severity: match.kind === 'brand' || match.kind === 'homograph' || match.kind === 'brand-in-subdomain' ? 'high' : 'medium',
      reason: reasonFor(match, what, host),
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