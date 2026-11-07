import { makeFlag } from '../flag';
import { findLinks, registrableDomain } from '../links';
import type { RedFlag, Rule } from '../types';

export const linkTextMismatch: Rule = {
  id: 'link-text-mismatch',
  check(input) {
    const flags: RedFlag[] = [];
    for (const anchor of input.anchors) {
      const visible = input.text.slice(anchor.textStart, anchor.textEnd);
      const shown = findLinks(visible, anchor.textStart)[0];
      if (!shown) continue;
      const shownSite = registrableDomain(shown.host);
      const realSite = registrableDomain(anchor.href.host);
      if (shownSite === realSite) continue;
      flags.push(
        makeFlag(
          {
            type: 'link-text-mismatch',
            label: 'Link text hides real address',
            severity: 'high',
            reason: `The link shows ${shownSite} but actually opens ${realSite}.`,
            source: 'body',
            start: anchor.textStart,
            end: anchor.textEnd,
            destination: anchor.href.url,
          },
          input.text,
        ),
      );
    }
    return flags;
  },
};