import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['*.config.{js,ts}', 'csp.ts', 'ocr-assets.ts', 'scripts/**/*.mjs', 'tests/**/*.ts', 'src/**/*.test.{ts,tsx}', 'src/test-setup.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);