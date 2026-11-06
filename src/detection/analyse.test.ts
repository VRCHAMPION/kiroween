import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyse } from './analyse';
import { verdictFor } from './score';
import type { AnalysisInput, AnalysisResult, RedFlag } from './types';

/** Phrases that trigger rules, mixed into generated messages so the properties see real flags. */
const SCAM_PHRASES = [
  'Your KYC has expired',
  'within 24 hours',
  'share the OTP',
  'install AnyDesk',
  'approve the collect request',
  'Google Play gift cards',
  'parcel is held at customs',
  'customs fee',
  'electricity will be disconnected',
  'digital arrest',
  'Earn \u20b95,000 daily',
  'https://bit.ly/x1',
  'https://paypa1.example/login',
  'http://203.0.113.9/a',
  'https://\u0455bi.example',
  '<a href="https://evil.example">www.vandanabank.example</a>',
  'Download app.apk',
];

const messageText = fc
  .array(fc.oneof(fc.constantFrom(...SCAM_PHRASES), fc.string({ unit: 'binary', maxLength: 20 })), { maxLength: 8 })
  .map((parts) => parts.join(' '));

const input: fc.Arbitrary<AnalysisInput> = fc.record(
  {
    text: messageText,
    headers: fc.oneof(
      fc.string({ maxLength: 60 }),
      fc.constant('Authentication-Results: x; spf=fail; dkim=fail; dmarc=fail\nFrom: A <a@paypa1.example>'),
      fc.dictionary(fc.constantFrom('From', 'Subject', 'Authentication-Results'), fc.string({ maxLength: 40 })),
    ),
    attachments: fc.array(fc.oneof(fc.constantFrom('a.apk', 'b.exe', 'c.scr', 'd.html', 'e.docm', 'f.pdf'), fc.string({ maxLength: 12 })), {
      maxLength: 4,
    }),
  },
  { requiredKeys: ['text'] },
);

function sourceOf(flag: RedFlag, given: AnalysisInput, result: AnalysisResult): string {
  if (flag.source === 'body') return given.text;
  if (flag.source === 'header') return result.headerText;
  return given.attachments?.[flag.attachmentIndex ?? -1] ?? '';
}

describe('analyse examples', () => {
  it('returns the documented result shape', () => {
    const result = analyse({ text: 'Your KYC has expired. Update within 24 hours: https://bit.ly/abc' });
    expect(result.verdict).toBe('likely scam');
    expect(result.flags.map((f) => f.type)).toEqual(['kyc-expiry', 'urgency', 'url-shortener']);
    for (const f of result.flags) {
      expect(f.label.length).toBeGreaterThanOrEqual(1);
      expect(f.label.length).toBeLessThanOrEqual(40);
    }
  });

  it('sorts body flags before header flags before attachment flags', () => {
    const result = analyse({
      text: 'Pay at https://bit.ly/x',
      headers: { 'Authentication-Results': 'dmarc=fail' },
      attachments: ['ok.pdf', 'evil.exe'],
    });
    expect(result.flags.map((f) => f.source)).toEqual(['body', 'header', 'attachment']);
    expect(result.flags[2].attachmentIndex).toBe(1);
  });

  it('never words a reason as a certainty', () => {
    const result = analyse({
      text: SCAM_PHRASES.join('. '),
      headers: { 'Authentication-Results': 'spf=fail; dkim=fail; dmarc=fail' },
      attachments: ['a.apk', 'b.exe', 'c.html', 'd.docm', 'e.doc'],
    });
    expect(result.flags.length).toBeGreaterThan(15);
    for (const f of result.flags) {
      expect(f.reason).not.toMatch(/100%|definitely|guarantee|certain/i);
      expect(f.reason).not.toContain('\n');
    }
  });
});

describe('analyse properties', () => {
  // Feature: detection-engine, Property 1: Score stays within 0 to 100
  // Any message, header text and attachment list scores an integer from 0 to 100.
  it('always scores from 0 to 100', () => {
    fc.assert(
      fc.property(input, (given) => {
        const { score } = analyse(given);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 },
    );
  });

  // Feature: detection-engine, Property 4: Empty input looks safe
  // Text made only of whitespace, with no headers or attachments, looks safe and has no flags.
  it('treats empty or whitespace-only input as safe with no flags', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\u00a0', '\u2003'), { maxLength: 30 }), (chars) => {
        const result = analyse({ text: chars.join('') });
        expect(result).toEqual({ score: 0, verdict: 'looks safe', flags: [], headerText: '' });
      }),
      { numRuns: 200 },
    );
  });

  // Feature: detection-engine, Property 5: Spans are exact
  // Every flag's span lies inside its source string and slices out exactly the flagged words.
  it('reports exact spans', () => {
    fc.assert(
      fc.property(input, (given) => {
        const result = analyse(given);
        for (const f of result.flags) {
          const source = sourceOf(f, given, result);
          expect(f.start).toBeGreaterThanOrEqual(0);
          expect(f.end).toBeGreaterThan(f.start);
          expect(f.end).toBeLessThanOrEqual(source.length);
          expect(source.slice(f.start, f.end)).toBe(f.text);
        }
      }),
      { numRuns: 300 },
    );
  });

  // Feature: detection-engine, Property 6: Analysis is deterministic and the verdict follows the score
  // Analysing the same input twice gives equal results, and the verdict always matches the score.
  it('is deterministic and keeps the verdict in line with the score', () => {
    fc.assert(
      fc.property(input, (given) => {
        const first = analyse(given);
        expect(analyse(given)).toEqual(first);
        expect(first.verdict).toBe(verdictFor(first.score));
      }),
      { numRuns: 200 },
    );
  });
});