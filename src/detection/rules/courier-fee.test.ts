import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { courierFee } from './courier-fee';

describe('courier-fee rule', () => {
  it('flags fee requests as high and held parcels as medium', () => {
    const flags = run(courierFee, 'Your parcel is held at customs. Pay the customs fee of Rs 49.');
    expect(flags.map((f) => [f.text, f.severity])).toEqual([
      ['parcel is held at customs', 'medium'],
      ['customs fee', 'high'],
    ]);
    expect(spans(run(courierFee, 'A redelivery charge applies.'))).toEqual(['redelivery charge']);
  });

  it('does not flag a normal delivery update', () => {
    expect(run(courierFee, 'Shipped by FastWay Couriers and will be delivered by Thu. No payment is due on delivery.')).toEqual([]);
  });
});