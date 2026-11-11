import { describe, expect, it } from 'vitest';
import { parseEml } from '../../src/email/parse-eml';
import { splitMessages, startsWithEnvelope } from './mbox';

const BODY = 'From: A <a@example.org>\nSubject: Hello\n\nHi there.\n';

describe('splitMessages', () => {
  it('drops the envelope line so headers parse the same with or without it', () => {
    const withEnvelope = splitMessages(`From a@b.example  Thu Aug 22 12:36:23 2002\n${BODY}`);
    const without = splitMessages(BODY);
    expect(withEnvelope).toHaveLength(1);
    expect(without).toHaveLength(1);
    expect(parseEml(withEnvelope[0]).headers).toEqual(parseEml(without[0]).headers);
  });

  it('splits an mbox into messages and unescapes >From lines', () => {
    const mbox = [
      'From a@b.example  Thu Aug 22 12:36:23 2002',
      'Subject: One',
      '',
      'Body one.',
      '>From here on.',
      '',
      'From c@d.example  Thu Aug 22 12:37:23 2002',
      'Subject: Two',
      '',
      'Body two.',
      '',
    ].join('\n');
    const messages = splitMessages(mbox);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('\nFrom here on.');
    expect(messages[0]).not.toContain('>From');
    expect(messages[1]).toContain('Subject: Two');
  });

  it('reads Windows line endings and returns nothing for an empty file', () => {
    expect(splitMessages(`From a@b.example  x\r\nSubject: One\r\n\r\nBody\r\n`)).toHaveLength(1);
    expect(splitMessages('')).toEqual([]);
    expect(splitMessages('  \n ')).toEqual([]);
  });

  it('detects the envelope line', () => {
    expect(startsWithEnvelope('From a@b.example  x\nSubject: y')).toBe(true);
    expect(startsWithEnvelope('From: a@b.example\nSubject: y')).toBe(false);
  });
});