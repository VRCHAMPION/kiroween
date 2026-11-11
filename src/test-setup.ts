import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import { ensureDetectionData } from './detection/data-loader';

// Every test runs against the full detection data (Public Suffix List, confusables, famous sites).
beforeAll(async () => {
  await ensureDetectionData();
});
afterEach(() => {
  cleanup();
});
