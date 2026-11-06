import { makeFlag } from '../flag';
import { isIpHost } from '../links';
import type { Rule } from '../types';

export const ipLink: Rule = {
  id: 'ip-link',
  check(input) {
    return input.links
      .filter((link) => isIpHost(link.host))
      .map((link) =>
        makeFlag(
          {
            type: 'ip-link',
            label: 'Link to a raw IP address',
            severity: 'high',
            reason: 'Real companies link to their own named website, not to a string of numbers.',
            source: 'body',
            start: link.start,
            end: link.end,
          },
          input.text,
        ),
      );
  },
};