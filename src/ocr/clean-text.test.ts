import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cleanOcrText } from './clean-text';

describe('cleanOcrText examples', () => {
  it('trims lines, joins spaces and keeps one empty line', () => {
    expect(cleanOcrText('  Dear  customer,\r\n\n\n\nYour   KYC\thas expired.  \n\n')).toBe('Dear customer,\n\nYour KYC has expired.');
  });

  it('returns an empty string for blank input', () => {
    expect(cleanOcrText(' \n\t\n ')).toBe('');
  });
});

describe('cleanOcrText properties', () => {
  const messy = fc
    .array(fc.oneof(fc.constantFrom(' ', '  ', '\t', '\n', '\r\n', '\u00a0', 'KYC', 'OTP', '\u20b9', 'https://bit.ly/x'), fc.string({ maxLength: 8 })), { maxLength: 30 })
    .map((parts) => parts.join(''));

  // Feature: screenshot-and-exorcism, Property 6: OCR text cleaning is idempotent and tidy
  // Cleaning twice changes nothing, and the result has no stray spaces or repeated empty lines.
  it('is idempotent and tidy', () => {
    fc.assert(
      fc.property(messy, (raw) => {
        const once = cleanOcrText(raw);
        expect(cleanOcrText(once)).toBe(once);
        const lines = once.split('\n');
        for (const line of lines) {
          expect(line).toBe(line.trim());
          expect(line).not.toMatch(/[ \t\u00a0]{2}/);
        }
        expect(once).not.toMatch(/\n\n\n/);
        if (once !== '') {
          expect(lines[0]).not.toBe('');
          expect(lines[lines.length - 1]).not.toBe('');
        }
      }),
      { numRuns: 500 },
    );
  });
});