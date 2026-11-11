import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const nodeGlobals = Object.fromEntries(
  ['process', 'console', 'URL', 'Buffer', '__dirname', 'setTimeout', 'clearTimeout'].map((g) => [
    g,
    'readonly',
  ]),
);

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      'packages/tokens/src/generated.ts',
      'packages/tokens/generated/**',
      'platforms/**',
      '**/.next/**',
      '**/out/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'apps/docs/generated/**',
      'apps/docs/.snippets/**',
      'apps/docs/.cache/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // TypeScript already resolves identifiers; no-undef only produces false positives on TS.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    // Playwright scripts run callbacks inside the page.
    files: ['scripts/audit-site.mjs'],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        innerWidth: 'readonly',
      },
    },
  },
);
