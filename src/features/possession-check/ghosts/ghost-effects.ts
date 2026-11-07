import { lookalikeParts, parseHost, registrableDomain, type CharRange, type RedFlag } from '../../../detection';

/** How a red flag haunts its words in Haunted view. */
export type GhostKind = 'lookalike' | 'bleed' | 'link' | 'haunt';

const LINK_TYPES: ReadonlySet<string> = new Set(['link-text-mismatch', 'url-shortener', 'ip-link', 'risky-tld']);

type FlagLike = Pick<RedFlag, 'type' | 'source' | 'text' | 'destination'>;

/** True for flags about a link in the message, whose ghost can speak the link's True Name. */
export function isLinkFlag(flag: FlagLike): boolean {
  return LINK_TYPES.has(flag.type) || (flag.type === 'lookalike-domain' && flag.source === 'body');
}

export function ghostKind(flag: Pick<RedFlag, 'type'>): GhostKind {
  if (flag.type === 'lookalike-domain') return 'lookalike';
  if (flag.type === 'urgency' || flag.type === 'threat') return 'bleed';
  if (LINK_TYPES.has(flag.type)) return 'link';
  return 'haunt';
}

// ---------- Fake deadlines ----------

/** The longest countdown shown, so a silly deadline cannot overflow the ghost. */
export const MAX_COUNTDOWN_SECONDS = 30 * 86400;

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  twelve: 12,
  'twenty-four': 24,
  'forty-eight': 48,
};

const WITHIN =
  /\bwithin\s+(\d{1,4}|one|two|three|four|five|six|twelve|twenty[- ]four|forty[- ]eight)\s*(hours?|hrs?|minutes?|mins?|days?)\b/i;

function unitSeconds(unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('d')) return 86400;
  if (u.startsWith('m')) return 60;
  return 3600;
}

/**
 * The deadline a message sets, in seconds, or 'midnight' for "today itself" and "tonight".
 * Undefined when the words state no deadline.
 */
export function deadlineOf(text: string): number | 'midnight' | undefined {
  const m = WITHIN.exec(text);
  if (m) {
    const word = m[1].toLowerCase().replace(' ', '-');
    const amount = /^\d+$/.test(word) ? Number(word) : NUMBER_WORDS[word];
    if (amount === undefined || amount <= 0) return undefined;
    return Math.min(MAX_COUNTDOWN_SECONDS, amount * unitSeconds(m[2]));
  }
  if (/\b(?:today|tonight) itself\b|\btonight\b/i.test(text)) {
    return 'midnight';
  }
  return undefined;
}

export function secondsUntilMidnight(now: Date): number {
  const passed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return Math.max(1, 86400 - passed);
}

/** Formats seconds as HH:MM:SS. Hours keep counting past 24, for example 48:00:00. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// ---------- True Names ----------

export interface TrueName {
  /** The real link address, or the sender domain for email senders. */
  address: string;
  /** The suspicious parts of the address. */
  parts: CharRange[];
  /** One plain-English line about what the True Name reveals. */
  note: string;
}

function hostIn(address: string): CharRange & { host: string } {
  const { host, offset } = parseHost(address);
  return { start: offset, end: offset + host.length, host };
}

function shift(ranges: readonly CharRange[], by: number): CharRange[] {
  return ranges.map((r) => ({ start: r.start + by, end: r.end + by }));
}

/** What a link or sender ghost reveals: the real destination with its suspicious part marked. */
export function trueNameFor(flag: FlagLike): TrueName | undefined {
  if (flag.type === 'lookalike-domain' && flag.source === 'header') {
    const parts = lookalikeParts(flag.text);
    return {
      address: flag.text,
      parts: parts.length > 0 ? parts : [{ start: 0, end: flag.text.length }],
      note: 'This sender address only pretends to belong to the real company.',
    };
  }
  if (!isLinkFlag(flag) || !flag.destination) {
    return undefined;
  }
  const address = flag.destination;
  const host = hostIn(address);
  if (host.host === '') {
    return undefined;
  }
  switch (flag.type) {
    case 'link-text-mismatch': {
      const real = registrableDomain(host.host);
      const shown = registrableDomain(parseHost(flag.text).host);
      return {
        address,
        parts: [{ start: host.end - real.length, end: host.end }],
        note: `The words show ${shown}, but the link really opens ${real}.`,
      };
    }
    case 'url-shortener':
      return {
        address,
        parts: [host],
        note: 'This short link hides its real destination. Phantom Inbox never opens links, so the true site stays hidden until someone clicks.',
      };
    case 'ip-link':
      return {
        address,
        parts: [host],
        note: 'Its true name is only a number. Real organisations use their own named website.',
      };
    case 'risky-tld': {
      const dot = host.host.lastIndexOf('.');
      return {
        address,
        parts: [{ start: host.start + Math.max(0, dot), end: host.end }],
        note: `Its true name ends in ${host.host.slice(Math.max(0, dot))}, an ending often used by scam sites.`,
      };
    }
    default: {
      const parts = shift(lookalikeParts(host.host), host.start);
      return {
        address,
        parts: parts.length > 0 ? parts : [host],
        note:
          parts.length > 0
            ? 'The highlighted letters only pretend to be real ones, so this is not the real website.'
            : 'It borrows a well-known name, but this is not that company\'s real website.',
      };
    }
  }
}

// ---------- Score candle ----------

/**
 * Height of the candle wax for a haunt score: full at 0, shorter as the score rises,
 * never below a small stub so the flame always has somewhere to burn.
 */
export function candleWaxHeight(score: number, full: number, stub: number): number {
  const s = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
  return Math.max(stub, Math.round(full * (1 - s / 100) * 100) / 100);
}