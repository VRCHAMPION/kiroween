import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { ipLink } from './ip-link';

describe('ip-link rule', () => {
  it('flags links to raw IP addresses', () => {
    expect(spans(run(ipLink, 'Go to http://203.0.113.45/vb/login.php now'))).toEqual(['http://203.0.113.45/vb/login.php']);
    expect(spans(run(ipLink, 'Pay at 198.51.100.7/pay'))).toEqual(['198.51.100.7/pay']);
  });

  it('does not flag times, amounts or named sites', () => {
    expect(run(ipLink, 'Meet at 9.30 pm, pay Rs 1.50 at https://swiftkart.example')).toEqual([]);
    expect(run(ipLink, 'Version 999.1.1.1 is out')).toEqual([]);
  });
});