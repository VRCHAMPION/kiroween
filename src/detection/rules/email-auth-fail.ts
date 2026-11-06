import { makeFlag } from '../flag';
import type { RedFlag, Rule, Severity } from '../types';

const RESULT = /\b(spf|dkim|dmarc)\s*=\s*(fail|softfail|permerror)\b/gi;
const RECEIVED_SPF = /^received-spf:\s*(fail|softfail)\b/gim;

const SEVERITY: Readonly<Record<string, Severity>> = { spf: 'medium', dkim: 'medium', dmarc: 'high' };
const REASON: Readonly<Record<string, string>> = {
  spf: 'The email was sent from a server the claimed sender does not use (SPF failed).',
  dkim: 'The email signature check failed, so it may have been forged or changed (DKIM failed).',
  dmarc: 'The sender name failed its own domain\'s anti-forgery check (DMARC failed).',
};

export const emailAuthFail: Rule = {
  id: 'email-auth-fail',
  check(input) {
    const flags: RedFlag[] = [];
    const add = (mechanism: string, start: number, end: number) =>
      flags.push(
        makeFlag(
          {
            type: 'email-auth-fail',
            label: 'Email failed sender checks',
            severity: SEVERITY[mechanism],
            reason: REASON[mechanism],
            source: 'header',
            start,
            end,
          },
          input.headerText,
        ),
      );
    for (const m of input.headerText.matchAll(RESULT)) {
      add(m[1].toLowerCase(), m.index, m.index + m[0].length);
    }
    for (const m of input.headerText.matchAll(RECEIVED_SPF)) {
      if (!flags.some((f) => f.start < m.index + m[0].length && m.index < f.end)) {
        add('spf', m.index, m.index + m[0].length);
      }
    }
    return flags.sort((a, b) => a.start - b.start);
  },
};