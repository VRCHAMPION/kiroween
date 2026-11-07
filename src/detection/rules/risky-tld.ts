import { makeFlag } from '../flag';
import { isIpHost, topLevelDomain } from '../links';
import type { Rule } from '../types';

/** Endings that scam campaigns use far more often than real organisations. */
export const RISKY_TLDS = new Set([
  'xyz', 'top', 'click', 'link', 'buzz', 'live', 'icu', 'work', 'rest', 'cam', 'sbs', 'cfd',
  'support', 'loan', 'tk', 'ml', 'ga', 'cf', 'gq', 'win', 'bid', 'cyou', 'zip', 'mov', 'country',
]);

export const riskyTld: Rule = {
  id: 'risky-tld',
  check(input) {
    return input.links
      .filter((link) => !isIpHost(link.host) && RISKY_TLDS.has(topLevelDomain(link.host)))
      .map((link) =>
        makeFlag(
          {
            type: 'risky-tld',
            label: 'Risky web address ending',
            severity: 'medium',
            reason: `Web addresses ending in .${topLevelDomain(link.host)} are often used by scam sites.`,
            source: 'body',
            start: link.hostStart,
            end: link.hostEnd,
            destination: link.url,
          },
          input.text,
        ),
      );
  },
};