import { analyse, type AnalysisResult, type RedFlag, type Severity } from '../../detection';
import type { SampleMessage, ScamTopic } from '../../data/samples';
import { isScamSample, type Guess } from './game';

export type Outcome = 'spotted-scam' | 'spotted-real' | 'missed-scam' | 'false-alarm';

export interface NumberedFlag {
  flag: RedFlag;
  number: number;
}

export interface Feedback {
  outcome: Outcome;
  title: string;
  message: string;
  /** The real engine's check of the message. */
  result: AnalysisResult;
  /** The main red flags, numbered in message order. Empty for real messages. */
  flags: NumberedFlag[];
  /** Why a real message is safe. Empty for scams. */
  safeReasons: readonly string[];
}

export const MAX_MAIN_FLAGS = 3;

export function outcomeOf(sample: Pick<SampleMessage, 'expectedVerdict'>, guess: Guess): Outcome {
  const scam = isScamSample(sample);
  if (scam) return guess === 'scam' ? 'spotted-scam' : 'missed-scam';
  return guess === 'real' ? 'spotted-real' : 'false-alarm';
}

const RANK: Readonly<Record<Severity, number>> = { high: 3, medium: 2, low: 1 };
const SOURCE_RANK = { body: 0, header: 1, attachment: 2 } as const;

/**
 * The few red flags worth teaching: strongest first, one per type, words in the message before
 * email details and attachments, at most three. Shown in the order they appear.
 */
export function mainFlags(result: AnalysisResult): NumberedFlag[] {
  const ranked = [...result.flags].sort(
    (a, b) => RANK[b.severity] - RANK[a.severity] || SOURCE_RANK[a.source] - SOURCE_RANK[b.source] || a.start - b.start,
  );
  const chosen: RedFlag[] = [];
  for (const flag of ranked) {
    if (chosen.length >= MAX_MAIN_FLAGS) break;
    if (!chosen.some((c) => c.type === flag.type)) chosen.push(flag);
  }
  const order = new Map(result.flags.map((f, i) => [f.id, i]));
  return chosen
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((flag, i) => ({ flag, number: i + 1 }));
}

const WORDING: Readonly<Record<Outcome, { title: string; message: string }>> = {
  'spotted-scam': {
    title: 'Well spotted!',
    message: 'This practice message is a scam. These are the signs that give it away.',
  },
  'spotted-real': {
    title: 'Well spotted!',
    message: 'This practice message is real. Here is why it is fine.',
  },
  'missed-scam': {
    title: 'This one was a scam',
    message: 'This practice message is a scam. It is an easy one to miss, because scams are made to look normal. Here is where the ghost was hiding.',
  },
  'false-alarm': {
    title: 'This one was real',
    message: 'This practice message is real. Being careful is good. Here is why this one is fine, so you can trust messages like it.',
  },
};

/** Builds the kind explanation for one answer, using the real detection engine. */
export function feedbackFor(sample: SampleMessage, guess: Guess): Feedback {
  const outcome = outcomeOf(sample, guess);
  const result = analyse(sample);
  const scam = isScamSample(sample);
  return {
    outcome,
    ...WORDING[outcome],
    result,
    flags: scam ? mainFlags(result) : [],
    safeReasons: scam ? [] : (sample.safeReasons ?? []),
  };
}

/** One tip for each kind of scam, shown on the end screen for the kinds a player missed. */
export const TOPIC_TIPS: Readonly<Record<ScamTopic, { label: string; tip: string }>> = {
  'KYC expiry': {
    label: '"Your KYC has expired" messages',
    tip: 'Banks and wallets never ask you to update KYC through a link in a message.',
  },
  'Courier fee': {
    label: 'Parcel and customs fee messages',
    tip: 'Real couriers do not ask for small fees through links. Track parcels only in the courier\'s own app.',
  },
  'Electricity disconnection': {
    label: '"Power will be cut tonight" messages',
    tip: 'Electricity boards send written notices. They do not ask you to call an officer or install an app.',
  },
  'UPI refund': {
    label: 'Refunds that need your UPI PIN',
    tip: 'You never scan a code, approve a request or enter your PIN to receive money.',
  },
  'Job task': {
    label: 'Easy money for small online tasks',
    tip: 'Real jobs never ask you to pay, and nobody pays big daily sums for liking or rating things.',
  },
  'Digital arrest': {
    label: '"Digital arrest" calls and messages',
    tip: 'Police never arrest anyone on a video call or ask for money to clear your name.',
  },
  'Lookalike link': {
    label: 'Copycat links and senders',
    tip: 'Read the web address letter by letter. Open the real app yourself instead of tapping the link.',
  },
  'Risky attachment': {
    label: 'Dangerous files',
    tip: 'Do not open .apk, .exe, .html or macro files from a message, even if it looks official.',
  },
};

/** A kind line for the end screen, whatever the score. */
export function endSummary(score: number, total: number): string {
  if (score >= total) return 'A perfect s\u00e9ance! You spotted every one.';
  if (score >= Math.ceil(total * 0.7)) return 'Great work. You have a sharp eye for scams.';
  if (score >= Math.ceil(total * 0.4)) return 'Good effort. Every game makes you better at spotting the tricks.';
  return 'Thank you for practising. Scams are made to trick people, and practice really helps.';
}