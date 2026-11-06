import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { riskyTld } from './risky-tld';

describe('risky-tld rule', () => {
  it('flags hosts with endings often used by scam sites', () => {
    const flags = run(riskyTld, 'Pay here: https://indiapost-redelivery.top/pay');
    expect(spans(flags)).toEqual(['indiapost-redelivery.top']);
    expect(flags[0].reason).toContain('.top');
  });

  it('does not flag common endings', () => {
    expect(run(riskyTld, 'Visit https://swiftkart.example and https://news.example.in')).toEqual([]);
  });
});