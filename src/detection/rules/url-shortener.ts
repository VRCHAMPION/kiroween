import { makeFlag } from '../flag';
import { registrableDomain } from '../links';
import type { Rule } from '../types';

export const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc',
  'ow.ly', 'rebrand.ly', 's.id', 't.ly', 'v.gd', 'bit.do', 'shorte.st', 'tinu.be', 'urlz.fr',
]);

export const urlShortener: Rule = {
  id: 'url-shortener',
  check(input) {
    return input.links
      .filter((link) => SHORTENERS.has(registrableDomain(link.host)) || SHORTENERS.has(link.host.toLowerCase()))
      .map((link) =>
        makeFlag(
          {
            type: 'url-shortener',
            label: 'Shortened link',
            severity: 'medium',
            reason: 'This short link hides the real website it will open.',
            source: 'body',
            start: link.start,
            end: link.end,
          },
          input.text,
        ),
      );
  },
};