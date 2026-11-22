import { Pool } from 'pg'
import type { TestProject } from 'vitest/node'

import {
  EMBEDDED_POOL_MAX,
  MEMORY_DATA_DIR,
  startEmbeddedPostgres,
} from '../../src/infra/database/embedded/embedded-postgres'
import { runMigrations } from '../../src/infra/database/migrate'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
    databasePoolMax: number
  }
}

/**
 * Gives the e2e run a migrated, empty Postgres and removes it afterwards:
 * - with DATABASE_URL (docker compose, CI): a new database `e2e_<timestamp>` on that server;
 * - without it: the embedded PGlite in memory (the same helper the API uses in development), so no Docker is needed.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const serverUrl = process.env.DATABASE_URL

  if (serverUrl) {
    const name = `e2e_${Date.now()}`
    const admin = new Pool({ connectionString: serverUrl, max: 1 })
    await admin.query(`CREATE DATABASE "${name}"`)

    const url = new URL(serverUrl)
    url.pathname = `/${name}`
    await runMigrations(url.toString())

    project.provide('databaseUrl', url.toString())
    project.provide('databasePoolMax', 5)

    return async () => {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
      await admin.end()
    }
  }

  const embedded = await startEmbeddedPostgres({ dataDir: MEMORY_DATA_DIR })
  await runMigrations(embedded.url)

  project.provide('databaseUrl', embedded.url)
  // PGlite is a single session: one connection per pool keeps statements from different requests apart.
  project.provide('databasePoolMax', EMBEDDED_POOL_MAX)

  return () => embedded.stop()
}
