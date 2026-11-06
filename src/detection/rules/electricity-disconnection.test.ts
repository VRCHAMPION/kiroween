import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { electricityDisconnection } from './electricity-disconnection';

describe('electricity-disconnection rule', () => {
  it('flags disconnection threats and the "bill not updated" phrase', () => {
    expect(spans(run(electricityDisconnection, 'Your electricity will be disconnected tonight.'))).toEqual([
      'electricity will be disconnected',
    ]);
    expect(spans(run(electricityDisconnection, 'Your previous month bill was not updated.'))).toEqual(['bill was not updated']);
  });

  it('does not flag a normal bill', () => {
    expect(run(electricityDisconnection, 'Your electricity bill for account 4401-2290 has been generated.')).toEqual([]);
  });
});