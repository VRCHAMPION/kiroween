import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SAMPLES, type SampleMessage } from '../../data/samples';
import { endSummary, feedbackFor, MAX_MAIN_FLAGS, outcomeOf, TOPIC_TIPS } from './feedback';
import { isScamSample, type Guess } from './game';

const SHAMING = /\b(wrong|stupid|silly|dumb|fail\w*|fool\w*|careless|mistake\w*|bad)\b/i;
const sample = (id: string) => SAMPLES.find((s) => s.id === id) as SampleMessage;

function sourceOf(s: SampleMessage, flag: { source: string; attachmentIndex?: number }, headerText: string): string {
  if (flag.source === 'body') return s.text;
  if (flag.source === 'header') return headerText;
  return s.attachments?.[flag.attachmentIndex ?? -1] ?? '';
}

describe('feedback examples', () => {
  it('praises a spotted scam and shows its main red flags in message order', () => {
    const fb = feedbackFor(sample('scam-kyc-expiry'), 'scam');
    expect(fb.outcome).toBe('spotted-scam');
    expect(fb.title).toBe('Well spotted!');
    expect(fb.flags.map((f) => f.flag.type)).toEqual(['kyc-expiry', 'threat', 'urgency']);
    expect(fb.flags.map((f) => f.number)).toEqual([1, 2, 3]);
    expect(fb.flags.map((f) => f.flag.text)).toEqual(['KYC has expired', 'account will be blocked', 'within 24 hours']);
  });

  it('shows the hidden ghost kindly when a scam is missed', () => {
    const fb = feedbackFor(sample('scam-paypal-homoglyph'), 'real');
    expect(fb.outcome).toBe('missed-scam');
    expect(fb.title).toBe('This one was a scam');
    expect(fb.message).toContain('easy one to miss');
    expect(fb.flags.length).toBeGreaterThan(0);
    expect(fb.flags.every((f) => f.flag.reason.length > 0)).toBe(true);
  });

  it('explains calmly why a real message was fine', () => {
    const fb = feedbackFor(sample('genuine-otp-payment'), 'scam');
    expect(fb.outcome).toBe('false-alarm');
    expect(fb.title).toBe('This one was real');
    expect(fb.message).toContain('Being careful is good');
    expect(fb.flags).toEqual([]);
    expect(fb.safeReasons).toEqual(sample('genuine-otp-payment').safeReasons);
    expect(fb.result.verdict).toBe('looks safe');
  });

  it('has a tip for every scam topic in the pool', () => {
    for (const s of SAMPLES.filter(isScamSample)) expect(TOPIC_TIPS[s.topic as keyof typeof TOPIC_TIPS], s.id).toBeDefined();
  });

  it('has a kind end line for every score', () => {
    expect(endSummary(10, 10)).toBe('A perfect s\u00e9ance! You spotted every one.');
    expect(endSummary(7, 10)).toBe('Great work. You have a sharp eye for scams.');
    expect(endSummary(4, 10)).toBe('Good effort. Every game makes you better at spotting the tricks.');
    expect(endSummary(0, 10)).toBe('Thank you for practising. Scams are made to trick people, and practice really helps.');
    for (let s = 0; s <= 10; s += 1) expect(endSummary(s, 10)).not.toMatch(SHAMING);
  });
});

describe('feedback properties', () => {
  // Feature: seance, Property 5: Feedback is kind and points at real words
  // For any sample and answer, feedback matches the truth, never shames, and points at real words.
  it('is kind, matches the truth and points at real words', () => {
    fc.assert(
      fc.property(fc.constantFrom(...SAMPLES), fc.constantFrom<Guess>('real', 'scam'), (s, guess) => {
        const fb = feedbackFor(s, guess);
        expect(fb.outcome).toBe(outcomeOf(s, guess));
        expect(fb.outcome.startsWith('spotted')).toBe((guess === 'scam') === isScamSample(s));
        expect(`${fb.title} ${fb.message}`).not.toMatch(SHAMING);
        expect(fb.message).toContain('practice message');
        expect(fb.flags.length).toBeLessThanOrEqual(MAX_MAIN_FLAGS);
        expect(new Set(fb.flags.map((f) => f.flag.type)).size).toBe(fb.flags.length);
        for (const { flag } of fb.flags) {
          const source = sourceOf(s, flag, fb.result.headerText);
          expect(source.slice(flag.start, flag.end)).toBe(flag.text);
        }
        if (isScamSample(s)) {
          expect(fb.flags.length).toBeGreaterThan(0);
          expect(fb.safeReasons).toEqual([]);
        } else {
          expect(fb.flags).toEqual([]);
          expect(fb.safeReasons.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 },
    );
  });
});