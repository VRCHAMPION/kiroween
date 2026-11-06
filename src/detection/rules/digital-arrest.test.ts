import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { digitalArrest } from './digital-arrest';

describe('digital-arrest rule', () => {
  it('flags the digital arrest story', () => {
    const text =
      'I am from the CBI. A parcel in your name containing drugs was found. You are under digital arrest. Stay on the video call.';
    expect(spans(run(digitalArrest, text))).toEqual([
      'CBI',
      'parcel in your name containing drugs',
      'digital arrest',
      'Stay on the video call',
    ]);
  });

  it('does not flag ordinary calls or parcels', () => {
    expect(run(digitalArrest, 'Your parcel arrives today. I will video call you later.')).toEqual([]);
  });
});