// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * ESLint for plain Node workspaces without a framework: config files and tooling scripts (packages/config). Not type-aware, so it also lints `.mjs` files that no tsconfig includes.
 *
 * @returns {import('eslint').Linter.Config[]}
 */
export const nodeConfig = () => [
  { ignores: ['node_modules', 'dist'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  eslintPluginPrettierRecommended,
]
