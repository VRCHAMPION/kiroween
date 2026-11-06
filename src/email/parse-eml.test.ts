import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeEncodedWords, EmlParseError, htmlToText, parseEml } from './parse-eml';
import { b64, PHISHING_EML, utf8 } from './test-fixtures';


/** Quoted-printable encoder used only to build test fixtures. */
function qp(text: string): string {
  let out = '';
  let line = 0;
  for (const byte of utf8(text)) {
    const piece = byte >= 33 && byte <= 126 && byte !== 61 ? String.fromCharCode(byte) : `=${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    if (line + piece.length > 72) {
      out += '=\r\n';
      line = 0;
    }
    out += piece;
    line += piece.length;
  }
  return out;
}



describe('parseEml examples', () => {
  it('reads headers, the HTML body with links, and attachments', () => {
    const email = parseEml(PHISHING_EML);
    expect(email.from).toBe('"Vandana Bank" <alerts@vandana-bank-alerts.example>');
    expect(email.subject).toBe('Your e-statement \u20b9 notice');
    expect(email.headers['Authentication-Results']).toBe(
      'mx.mail.example; spf=fail smtp.mailfrom=vandana-bank-alerts.example; dkim=fail; dmarc=fail',
    );
    expect(email.headerText).not.toContain('Received:');
    expect(email.body).toBe('Your KYC has expired. Log in at https://www.vandanabank.example/login <http://203.0.113.45/vb>');
    expect(email.links).toEqual(['https://www.vandanabank.example/login', 'http://203.0.113.45/vb']);
    expect(email.attachments).toEqual(['VB_Update.apk']);
  });

  it('falls back to the plain-text part and reads RFC 2231 file names', () => {
    const raw = [
      'From: a@b.example',
      'Content-Type: multipart/mixed; boundary=b1',
      '',
      '--b1',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      b64('Namaste \u20b9 500'),
      '--b1',
      "Content-Disposition: attachment; filename*=UTF-8''Bill%20%E2%82%B9.pdf",
      '',
      'xx',
      '--b1--',
    ].join('\n');
    const email = parseEml(raw);
    expect(email.body).toBe('Namaste \u20b9 500');
    expect(email.attachments).toEqual(['Bill \u20b9.pdf']);
  });

  it('reads a simple single-part email', () => {
    const email = parseEml('From: a@b.example\nSubject: Hi\n\nHello there.\n');
    expect(email.body).toBe('Hello there.');
    expect(email.attachments).toEqual([]);
  });

  it('rejects files without an email header block', () => {
    expect(() => parseEml('just some text\nwith lines')).toThrow(EmlParseError);
    expect(() => parseEml('')).toThrow(EmlParseError);
  });

  it('decodes Q encoded words and joins adjacent words', () => {
    expect(decodeEncodedWords('=?UTF-8?Q?Hello_World?= =?UTF-8?Q?=21?=')).toBe('Hello World!');
  });

  it('converts HTML to text without keeping tags or scripts', () => {
    expect(htmlToText('<script>alert(1)</script><p>A &amp; B</p><ul><li>One</li></ul><a href="https://x.example">https://x.example</a>')).toBe(
      'A & B\n\n- One\n\nhttps://x.example',
    );
  });
});

const safeText = fc.string({ unit: 'grapheme', maxLength: 80 });

describe('parseEml properties', () => {
  // Feature: possession-check-ui, Property 3: Email bodies survive an .eml round trip
  // A UTF-8 body sent as base64 or quoted-printable, with an encoded subject, parses back unchanged.
  it('round-trips encoded bodies and subjects', () => {
    fc.assert(
      fc.property(safeText, safeText.filter((s) => !/[\r\n]/.test(s)), fc.constantFrom('base64', 'quoted-printable'), (body, subject, encoding) => {
        const encoded = encoding === 'base64' ? b64(body) : qp(body);
        const raw = [
          'From: sender@mail.example',
          `Subject: =?UTF-8?B?${b64(subject)}?=`,
          'Content-Type: text/plain; charset=utf-8',
          `Content-Transfer-Encoding: ${encoding}`,
          '',
          encoded,
        ].join('\r\n');
        const email = parseEml(raw);
        expect(email.body).toBe(body.replace(/\r\n?/g, '\n').trim());
        expect(email.subject).toBe(subject);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: possession-check-ui, Property 4: Attachment names survive an .eml round trip
  // Every attachment part's file name is read back in order.
  it('round-trips attachment names', () => {
    const name = fc.stringMatching(/^[A-Za-z0-9_-]{1,20}\.(pdf|apk|exe|docm|jpg|html)$/);
    fc.assert(
      fc.property(fc.array(name, { minLength: 1, maxLength: 5 }), (names) => {
        const parts = names.flatMap((n) => ['--zz', `Content-Disposition: attachment; filename="${n}"`, '', 'data']);
        const raw = ['From: a@b.example', 'Content-Type: multipart/mixed; boundary="zz"', '', '--zz', 'Content-Type: text/plain', '', 'See attached.', ...parts, '--zz--'].join('\n');
        const email = parseEml(raw);
        expect(email.attachments).toEqual(names);
        expect(email.body).toBe('See attached.');
      }),
      { numRuns: 200 },
    );
  });
});