// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * The dependency rule of the API (apps/api/CLAUDE.md): arrows point inwards.
 * core <- domain <- infra / presentations. The inner rings never know the outer ones.
 */
export const innerRingPatterns = [
  {
    group: ['@infra/*', '**/infra/**'],
    message: 'domain/core cannot import infra. Declare an abstract class in applications/ and implement it in infra.',
  },
  {
    group: ['@presentations/*', '**/presentations/**'],
    message: 'domain/core cannot import presentations: the HTTP edge depends on the domain, never the opposite.',
  },
  {
    group: ['drizzle-orm', 'drizzle-orm/*', 'pg', 'bcryptjs', '@nestjs/jwt', '@nestjs/swagger', 'class-validator'],
    message: 'domain/core does not know persistence, crypto or transport libraries.',
  },
]

/**
 * ESLint for a NestJS app with Clean Architecture layers under `src/core`, `src/domain`, `src/infra` and
 * `src/presentations`. Spread it into `defineConfig(...)`.
 *
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export const nestConfig = ({ tsconfigRootDir }) => [
  {
    ignores: ['dist', 'coverage', 'node_modules', 'drizzle', '.pglite', '**/*.js', '**/*.mjs', '**/*.d.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
        // Nest resolves constructor dependencies from emitted metadata: with these flags,
        // `consistent-type-imports` keeps injected classes as value imports instead of `import type`.
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/core/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: innerRingPatterns }],
    },
  },
  // A use case never imports another use case: shared logic goes to a repository method, a pure policy or a
  // domain event. Flat config does not merge rule options, so the inner-ring patterns are repeated here.
  {
    files: ['src/domain/**/*.use-case.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...innerRingPatterns,
            {
              group: ['**/*.use-case', '**/*.use-case.ts'],
              message:
                'A use case does not import another use case. Move the shared logic to a policy, a repository method or a domain event.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            ...innerRingPatterns,
            // `core/domain/` is core's own folder; only `src/domain/` (the bounded contexts) is off limits.
            {
              group: ['@domain/*', '../../domain/**', '**/src/domain/**'],
              message: 'core is the innermost ring: it knows no bounded context.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
]
