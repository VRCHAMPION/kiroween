import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { urlShortener } from './url-shortener';

describe('url-shortener rule', () => {
  it('flags common shorteners with and without http', () => {
    expect(spans(run(urlShortener, 'Update now: https://bit.ly/vb-kyc-2291.'))).toEqual(['https://bit.ly/vb-kyc-2291']);
    expect(spans(run(urlShortener, 'Join cutt.ly/task-earn'))).toEqual(['cutt.ly/task-earn']);
  });

  it('does not flag normal websites', () => {
    expect(run(urlShortener, 'Track at https://swiftkart.example/track/1')).toEqual([]);
  });
});