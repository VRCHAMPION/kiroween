import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { CSP } from './csp.ts';
import { OCR_ASSETS } from './ocr-assets.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));
const fromModules = (source: string) => join(ROOT, 'node_modules', source);

/** Copies the OCR worker, cores and language data into the build, and serves them in dev. */
function ocrAssets(): Plugin {
  return {
    name: 'phantom-ocr-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\//, '');
        const asset = OCR_ASSETS.find((a) => a.path === path);
        if (!asset) {
          next();
          return;
        }
        res.setHeader('Content-Type', asset.contentType);
        res.end(readFileSync(fromModules(asset.source)));
      });
    },
    generateBundle() {
      for (const asset of OCR_ASSETS) {
        this.emitFile({ type: 'asset', fileName: asset.path, source: readFileSync(fromModules(asset.source)) });
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ocrAssets(),
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