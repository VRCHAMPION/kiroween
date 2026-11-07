export type Severity = 'low' | 'medium' | 'high';
export type Verdict = 'likely scam' | 'suspicious' | 'looks safe';
export type FlagSource = 'body' | 'header' | 'attachment';

export const FLAG_TYPES = [
  'lookalike-domain',
  'link-text-mismatch',
  'url-shortener',
  'ip-link',
  'risky-tld',
  'email-auth-fail',
  'urgency',
  'threat',
  'sensitive-info-request',
  'remote-access-app',
  'payment-request',
  'kyc-expiry',
  'courier-fee',
  'electricity-disconnection',
  'upi-refund',
  'job-task-scam',
  'digital-arrest',
  'risky-attachment',
] as const;

export type FlagType = (typeof FLAG_TYPES)[number];

export interface RedFlag {
  /** Stable id: type:source:attachmentIndex:start:end */
  id: string;
  type: FlagType;
  /** Short name for the trick, 1 to 40 characters. */
  label: string;
  severity: Severity;
  /** One plain-English line. Never claims certainty. */
  reason: string;
  source: FlagSource;
  /** Inclusive UTF-16 offset into the source string. */
  start: number;
  /** Exclusive UTF-16 offset into the source string. */
  end: number;
  /** The flagged words: source.slice(start, end). */
  text: string;
  /** Index into input.attachments when source is 'attachment'. */
  attachmentIndex?: number;
  /** The real address a link opens, for link flags found in the message. */
  destination?: string;
}

export interface AnalysisInput {
  text: string;
  headers?: Readonly<Record<string, string>> | string;
  attachments?: readonly string[];
}

export interface AnalysisResult {
  score: number;
  verdict: Verdict;
  flags: RedFlag[];
  /** The header string that header spans point into. */
  headerText: string;
}

export interface Link {
  url: string;
  start: number;
  end: number;
  host: string;
  hostStart: number;
  hostEnd: number;
}

export interface AnchorLink {
  /** Visible link text range in the body. */
  textStart: number;
  textEnd: number;
  href: Link;
}

export interface PreparedInput {
  text: string;
  headerText: string;
  attachments: readonly string[];
  links: readonly Link[];
  anchors: readonly AnchorLink[];
}

export interface Rule {
  id: string;
  check(input: PreparedInput): RedFlag[];
}