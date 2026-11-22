import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { type AddressInfo, connect, createServer } from 'node:net'
import { isAbsolute, join, resolve } from 'node:path'

import { localStateDir } from '../../env/local-state'

/** Keeps nothing on disk: the database lives and dies with the process (tests, the OpenAPI export). */
export const MEMORY_DATA_DIR = 'memory://'

export const defaultDataDir = join(localStateDir, 'data')

export type EmbeddedPostgresOptions = {
  /** A folder, or `memory://`. Default: `apps/api/.pglite/data`. */
  dataDir?: string
  /** `0` (default) picks a free port. */
  port?: number
}

export type EmbeddedPostgres = {
  /** What `pg` connects to. */
  url: string
  port: number
  /** The folder with the data, or `memory://`. */
  dataDir: string
  persistent: boolean
  stop(): Promise<void>
}

/**
 * PGlite is one session, however many clients connect: two connections would see each other's transaction. Every
 * pool that talks to it must therefore hold a single connection.
 */
export const EMBEDDED_POOL_MAX = 1

const HOST = '127.0.0.1'

/** Loaded on demand: a production image, which always has `DATABASE_URL`, does not need these packages. */
async function loadPglite() {
  try {
    const [{ PGlite }, { PGLiteSocketServer }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('@electric-sql/pglite-socket'),
    ])

    return { PGlite, PGLiteSocketServer }
  } catch (error) {
    throw new Error(
      'The embedded database needs @electric-sql/pglite and @electric-sql/pglite-socket (development dependencies). ' +
        'Install them, or set DATABASE_URL to use a real Postgres.',
      { cause: error },
    )
  }
}

/** `.pglite/data` -> `.pglite/data.lock`: next to the folder, so it is never mistaken for a file of Postgres. */
export const lockFileOf = (dataDir: string): string => `${dataDir}.lock`

/** What the lock file says: who has the folder open, and where to ask whether it still does. */
type LockHolder = { pid: number; port: number; token: string }

const LOCK_GREETING = 'app-embedded-postgres'
/** PGlite runs in the thread of its process: while it works (creating a database takes seconds) nothing answers. */
const LOCK_PROBE_TIMEOUT_MS = 3_000

const greetingOf = (token: string): string => `${LOCK_GREETING} ${token}\n`

/**
 * - `held`: the process that wrote the file answered with its token;
 * - `silent`: something has that port open and said nothing in time. It may be the holder, busy: it counts as held;
 * - `gone`: nothing listens there, or whatever does is not the holder (the port now belongs to another program).
 */
type LockState = 'held' | 'silent' | 'gone'

function readHolder(lockFile: string): LockHolder | null {
  try {
    const { pid, port, token } = JSON.parse(readFileSync(lockFile, 'utf8')) as Record<string, unknown>
    if (typeof pid !== 'number' || typeof port !== 'number' || typeof token !== 'string') return null

    return Number.isInteger(port) && port > 0 && port < 65_536 ? { pid, port, token } : null
  } catch {
    // Gone (its holder just left) or not a lock file of ours.
    return null
  }
}

function isRunning(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false

  try {
    // Signal 0 sends nothing: it only asks whether the process exists.
    process.kill(pid, 0)

    return true
  } catch (error) {
    // EPERM: it exists and belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Asks the port of the lock file who is there. Only the process that wrote that file answers with its token. */
function probeLock({ port, token }: LockHolder, timeoutMs: number): Promise<LockState> {
  return new Promise((resolve) => {
    let heard = ''
    const socket = connect({ host: HOST, port })
    const finish = (state: LockState): void => {
      socket.destroy()
      resolve(state)
    }
    const judge = (): void => finish(heard === greetingOf(token) ? 'held' : 'gone')

    socket.setEncoding('utf8')
    // The wait for an answer starts once someone picked up. Until then the system decides: a port nobody listens on
    // refuses the connection (on Windows that takes a second or two).
    socket.once('connect', () => socket.setTimeout(timeoutMs, () => finish(heard === '' ? 'silent' : 'gone')))
    socket.on('data', (chunk: string) => {
      heard += chunk
      // The holder says one line and hangs up; whoever says more, or something else, is not the holder.
      if (heard.length >= greetingOf(token).length) judge()
    })
    socket.once('end', judge)
    // Refused, reset: nobody is there.
    socket.once('error', () => finish('gone'))
  })
}

/** Whether the process that wrote the lock file still has the folder open. */
async function stateOf(holder: LockHolder | null, timeoutMs: number): Promise<LockState> {
  // The usual leftover: the process was killed and its id is free. No need to knock on its port.
  if (!holder || !isRunning(holder.pid)) return 'gone'

  // The id is in use, but ids are reused: only the port says whether it is still the same process.
  return probeLock(holder, timeoutMs)
}

/**
 * Takes the folder for this process, and returns what gives it back.
 *
 * PGlite does not stop a second process from opening the same folder, and the two then overwrite each other
 * without any error (rows written by one are silently lost). It happens easily: `npm run dev` in two terminals.
 *
 * The lock is a listening socket, which the system closes when the process dies, however it dies; the file next to
 * the folder says which process opened it and where that socket is. A file whose process is gone, or whose socket
 * is closed, was left by a process that was killed (`--watch` does it on every restart) and is taken over. The
 * process id alone would not do: ids are reused, and a stale file would then lock the folder for no reason.
 */
export async function lockDataDir(
  dataDir: string,
  probeTimeoutMs: number = LOCK_PROBE_TIMEOUT_MS,
): Promise<() => Promise<void>> {
  const lockFile = lockFileOf(dataDir)
  const token = randomUUID()

  const beacon = createServer((socket) => {
    socket.on('error', () => undefined)
    socket.end(greetingOf(token))
  })
  // The lock must never be what keeps the process alive.
  beacon.unref()
  await new Promise<void>((resolve, reject) => {
    beacon.once('error', reject)
    beacon.listen(0, HOST, resolve)
  })
  const close = (): Promise<void> => new Promise((resolve) => beacon.close(() => resolve()))
  const { port } = beacon.address() as AddressInfo

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // `wx` fails when the file is already there: two processes starting together cannot both get it.
        writeFileSync(lockFile, JSON.stringify({ pid: process.pid, port, token }), { flag: 'wx' })

        return async () => {
          rmSync(lockFile, { force: true })
          await close()
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }

      const holder = readHolder(lockFile)
      const state = await stateOf(holder, probeTimeoutMs)
      if (holder && state !== 'gone') {
        throw new Error(
          [
            `The embedded database in ${dataDir} is already open in another process (pid ${holder.pid}).`,
            'Stop the other API, or give this one its own folder with PGLITE_DATA_DIR.',
            ...(state === 'silent'
              ? [`It did not answer, though: if nothing else is running, delete ${lockFile}.`]
              : []),
          ].join('\n'),
        )
      }
      rmSync(lockFile, { force: true })
    }

    throw new Error(`Could not lock the embedded database in ${dataDir}: ${lockFile} keeps coming back.`)
  } catch (error) {
    await close()
    throw error
  }
}

/**
 * Starts PGlite (Postgres compiled to WebAssembly, in this process) behind a local socket, so the rest of the app
 * talks to it with `pg` exactly as it talks to a real server. No Docker, no installation.
 *
 * It listens on 127.0.0.1 only and accepts any user and password: a development tool, never a production database.
 */
export async function startEmbeddedPostgres(options: EmbeddedPostgresOptions = {}): Promise<EmbeddedPostgres> {
  const { PGlite, PGLiteSocketServer } = await loadPglite()

  const requested = options.dataDir ?? defaultDataDir
  const persistent = !requested.startsWith(MEMORY_DATA_DIR)
  const dataDir = persistent ? (isAbsolute(requested) ? requested : resolve(requested)) : MEMORY_DATA_DIR
  // PGlite creates the last folder of the path only.
  if (persistent) mkdirSync(dataDir, { recursive: true })
  const unlock = persistent ? await lockDataDir(dataDir) : () => Promise.resolve()

  try {
    const database = await PGlite.create(dataDir)
    // More than one socket may be open (a pool, then `psql` or Drizzle Studio); statements still run one at a time.
    const server = new PGLiteSocketServer({ db: database, host: HOST, port: options.port ?? 0, maxConnections: 8 })

    try {
      await server.start()
    } catch (error) {
      await database.close()
      throw error
    }

    const port = Number(server.getServerConn().split(':').at(-1))

    return {
      url: `postgresql://postgres:postgres@${HOST}:${port}/postgres`,
      port,
      dataDir,
      persistent,
      async stop() {
        await server.stop()
        await database.close()
        await unlock()
      },
    }
  } catch (error) {
    await unlock()
    throw error
  }
}
