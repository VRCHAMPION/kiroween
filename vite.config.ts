import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { CSP } from './csp.ts';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'phantom-csp',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  ],
  test: {
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
});