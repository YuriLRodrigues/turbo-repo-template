import { existsSync } from 'node:fs'

import { defineConfig } from 'drizzle-kit'

if (existsSync('.env')) process.loadEnvFile()

/**
 * `npm run db:generate` writes a migration from the schema diff into `drizzle/` (never write one by hand);
 * `npm run db:migrate` applies the pending ones to DATABASE_URL.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/database/drizzle/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  verbose: true,
})
