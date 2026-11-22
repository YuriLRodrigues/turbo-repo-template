import { defineConfig } from 'vitest/config'

/**
 * Three projects, picked by file suffix (docs/patterns/api/testing.md):
 * - unit:        `*.unit.spec.ts`        no collaborators (entities, value objects, pure functions)
 * - integration: `*.integration.spec.ts` use cases with in-memory repositories, no Nest module
 * - e2e:         `test/e2e/*.e2e-spec.ts` HTTP routes against a real Postgres (DATABASE_URL or PGlite)
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.module.ts', 'src/**/*.dto.ts', 'src/infra/database/drizzle/schema/**'],
    },
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.unit.spec.ts'] } },
      { extends: true, test: { name: 'integration', include: ['src/**/*.integration.spec.ts'] } },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.e2e-spec.ts'],
          globalSetup: ['test/e2e/global-setup.ts'],
          fileParallelism: false,
          hookTimeout: 60_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
})
