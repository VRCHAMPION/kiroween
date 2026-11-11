import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { CSP } from './csp.ts';
import { OCR_ASSETS } from './ocr-assets.ts';
import { headersFor } from './scripts/vercel-headers.mjs';

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
        let source: string | Buffer = readFileSync(fromModules(asset.source));
        // The packages' source maps are not shipped, so drop the comment that points at them (it would 404 in DevTools).
        if (asset.contentType.startsWith('text/javascript')) {
          source = source.toString('utf8').replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, '\n');
        }
        this.emitFile({ type: 'asset', fileName: asset.path, source });
      }
    },
  };
}

/** `npm run preview` sends the same headers as the hosted site (vercel.json). The dev server stays exempt. */
function hostedHeaders(): Plugin {
  return {
    name: 'phantom-hosted-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
        for (const [key, value] of headersFor(pathname)) res.setHeader(key, value);
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ocrAssets(),
    hostedHeaders(),
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
  build: {
    rollupOptions: {
      output: {
        // The lazy detection data (Public Suffix List, confusables, famous sites) gets a recognisable name for the size report.
        chunkFileNames: (chunk) => (chunk.name === 'data-bundle' ? 'assets/detection-data-[hash].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});