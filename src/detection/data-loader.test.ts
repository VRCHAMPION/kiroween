import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyse } from './analyse';
import { ensureDetectionData, isDetectionDataLoaded, resetDetectionDataForTests } from './data-loader';

afterEach(async () => {
  vi.doUnmock('./data-bundle');
  await ensureDetectionData();
});

describe('detection data loader', () => {
  it('loads once and shares the same promise while loading', async () => {
    resetDetectionDataForTests();
    expect(isDetectionDataLoaded()).toBe(false);
    const first = ensureDetectionData();
    expect(ensureDetectionData()).toBe(first);
    await first;
    expect(isDetectionDataLoaded()).toBe(true);
    await expect(ensureDetectionData()).resolves.toBeUndefined();
  });

  it('resolves without data when the chunk cannot load, and tries again next time', async () => {
    vi.resetModules();
    vi.doMock('./data-bundle', () => {
      throw new Error('offline');
    });
    const loader = await import('./data-loader');
    await expect(loader.ensureDetectionData()).resolves.toBeUndefined();
    expect(loader.isDetectionDataLoaded()).toBe(false);
    vi.doUnmock('./data-bundle');
    vi.resetModules();
    const again = await import('./data-loader');
    await again.ensureDetectionData();
    expect(again.isDetectionDataLoaded()).toBe(true);
  });
});

describe('pre-load mode', () => {
  const messages = [
    'Log in at https://paypa1-secure.example/login now',
    'Visit https://hdfc-bank.xyz/kyc to update KYC today',
    'See you at lunch tomorrow, bring the keys.',
  ];

  it('gives the same result before and after the data loads for inputs that need no data', async () => {
    await ensureDetectionData();
    const after = messages.map((text) => analyse({ text }));
    resetDetectionDataForTests();
    const before = messages.map((text) => analyse({ text }));
    await ensureDetectionData();
    expect(before).toEqual(after);
  });

  it('still flags a curated brand lookalike before the data loads', () => {
    resetDetectionDataForTests();
    const flags = analyse({ text: 'Open https://paypa1.com/login' }).flags;
    expect(flags.some((f) => f.type === 'lookalike-domain')).toBe(true);
  });
});
