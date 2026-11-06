import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { linkTextMismatch } from './link-text-mismatch';

describe('link-text-mismatch rule', () => {
  it('flags an HTML link whose text shows another site', () => {
    const text = 'Log in: <a href="http://203.0.113.45/login">https://www.vandanabank.example/secure</a>';
    const flags = run(linkTextMismatch, text);
    expect(spans(flags)).toEqual(['https://www.vandanabank.example/secure']);
    expect(flags[0].reason).toContain('vandanabank.example');
    expect(flags[0].reason).toContain('203.0.113.45');
  });

  it('flags a Markdown link whose text shows another site', () => {
    expect(spans(run(linkTextMismatch, 'Open [www.vandanabank.example](https://evil-login.example/x)'))).toEqual([
      'www.vandanabank.example',
    ]);
  });

  it('flags "text <url>" pairs from plain-text emails', () => {
    expect(spans(run(linkTextMismatch, 'Visit vandanabank.example <https://vb-login.top/x>'))).toEqual(['vandanabank.example']);
  });

  it('does not flag matching links or plain words', () => {
    expect(run(linkTextMismatch, '<a href="https://vandanabank.example/a">www.vandanabank.example</a>')).toEqual([]);
    expect(run(linkTextMismatch, '<a href="https://vandanabank.example/a">Click here</a>')).toEqual([]);
  });
});