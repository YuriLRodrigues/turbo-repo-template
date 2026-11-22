import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

export const migrationsFolder = join(__dirname, '..', '..', '..', 'drizzle')

/** Applies the pending migrations with drizzle-orm's migrator (drizzle-kit is a dev dependency). */
export async function runMigrations(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString, max: 1 })

  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder })
  } finally {
    await pool.end()
  }
}

// `npm run db:migrate:prod` (compiled: node dist/infra/database/migrate)
if (require.main === module) {
  if (existsSync('.env')) process.loadEnvFile()

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  runMigrations(url)
    .then(() => console.info('[db:migrate] migrations applied'))
    .catch((error: unknown) => {
      console.error('[db:migrate] failed', error)
      process.exitCode = 1
    })
}
