import { AsyncLocalStorage } from 'node:async_hooks'
import { relative } from 'node:path'

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgAsyncDatabase } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

import { EnvService } from '@infra/env/env.service'

import { EMBEDDED_POOL_MAX, type EmbeddedPostgres, startEmbeddedPostgres } from '../embedded/embedded-postgres'
import { runMigrations } from '../migrate'
import { databaseErrorMessage } from './database-errors'

/** What repositories query: the pool, or the transaction the current request is in. */
export type Database = PgAsyncDatabase<NodePgQueryResultHKT>

/** Which database the app ended up on. The boot checklist prints it, so nobody has to guess. */
export type DatabaseTarget =
  | { kind: 'postgres'; host: string; database: string }
  | { kind: 'embedded'; port: number; dataDir: string; persistent: boolean }

/** A request that cannot get a connection in this time is stuck (or the database is gone): fail it loudly. */
const CONNECTION_TIMEOUT_MS = 10_000

/**
 * Owns the connection pool. Repositories use `db`; nothing outside `infra/database` touches the pool.
 *
 * - With `DATABASE_URL`: a pool on that Postgres.
 * - Without it (development only): starts the embedded PGlite, applies the migrations and connects to it.
 *
 * `db` follows the transaction opened by `transaction()` through the async context, so a repository called inside
 * a unit of work writes in it without being told.
 */
@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name)
  private readonly transactions = new AsyncLocalStorage<Database>()
  private pool?: Pool
  private root?: Database
  private embedded?: EmbeddedPostgres
  private connectedTo?: DatabaseTarget

  constructor(private readonly env: EnvService) {}

  async onModuleInit(): Promise<void> {
    const url = this.env.get('DATABASE_URL')

    if (url) {
      const { hostname, port, pathname } = new URL(url)
      this.connect(url, this.env.get('DATABASE_POOL_MAX'))
      this.connectedTo = {
        kind: 'postgres',
        host: port ? `${hostname}:${port}` : hostname,
        database: pathname.replace(/^\//, ''),
      }

      return
    }

    this.embedded = await startEmbeddedPostgres({
      dataDir: this.env.get('PGLITE_DATA_DIR'),
      port: this.env.get('PGLITE_PORT'),
    })
    const { port, dataDir, persistent } = this.embedded

    try {
      await runMigrations(this.embedded.url)
    } catch (error) {
      await this.embedded.stop()
      this.embedded = undefined
      throw new Error(
        [
          `Could not apply the migrations to the embedded database${persistent ? ` in ${dataDir}` : ''}.`,
          databaseErrorMessage(error),
          'If it was created by an older schema, delete that folder and start again.',
        ].join('\n'),
        { cause: error },
      )
    }

    this.connect(this.embedded.url, EMBEDDED_POOL_MAX)
    this.connectedTo = { kind: 'embedded', port, dataDir, persistent }
  }

  private connect(connectionString: string, max: number): void {
    this.pool = new Pool({ connectionString, max, connectionTimeoutMillis: CONNECTION_TIMEOUT_MS })
    // Without an `error` listener, an idle connection dropped by the server crashes the process.
    this.pool.on('error', (error) => this.logger.error(`Idle database connection failed: ${error.message}`))
    this.root = drizzle({ client: this.pool })
  }

  get db(): Database {
    const database = this.transactions.getStore() ?? this.root
    if (!database) throw new Error('The database is not connected yet: DrizzleService.onModuleInit() has not run.')

    return database
  }

  /** Undefined until the module is initialised. */
  get target(): DatabaseTarget | undefined {
    return this.connectedTo
  }

  /** One line for a person: `app on localhost:5432`, `embedded in .pglite/data, port 53211`. */
  describeTarget(): string {
    const target = this.connectedTo
    if (!target) return 'not connected'
    if (target.kind === 'postgres') return `${target.database} on ${target.host}`

    const where = target.persistent ? (relative(process.cwd(), target.dataDir) || '.').replace(/\\/g, '/') : 'memory'

    return `embedded in ${where}, port ${target.port}`
  }

  /**
   * Runs `work` in a transaction. Every `db` read inside it (in any repository, at any depth of awaits) is that
   * transaction. Called inside another transaction, it becomes a savepoint.
   */
  transaction<T>(work: () => Promise<T>): Promise<T> {
    return this.db.transaction((transaction) => this.transactions.run(transaction, work))
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
    await this.embedded?.stop()
  }
}
