import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * `apps/api/.pglite`: what a development machine keeps between runs (the embedded database and the generated JWT
 * secret). It is gitignored and safe to delete: the next start creates it again, empty.
 *
 * Three levels up from this file, in `src/` and in `dist/` alike.
 */
export const localStateDir = join(__dirname, '..', '..', '..', '.pglite')

const SECRET_FILE = 'dev-jwt-secret'

export type DevelopmentDefaults = {
  /** True when `JWT_SECRET` was missing and the secret of this machine was used. */
  generatedJwtSecret: boolean
}

/**
 * Lets `npm run dev` work on a fresh clone, with no `.env`: in development, a missing `JWT_SECRET` becomes a random
 * secret created once and kept in the local state folder (so sessions survive a restart). Outside development
 * nothing is filled in: a missing secret fails the boot.
 */
export function applyDevelopmentDefaults(
  env: Record<string, string | undefined>,
  stateDir: string = localStateDir,
): DevelopmentDefaults {
  const isDevelopment = (env.NODE_ENV?.trim() || 'development') === 'development'
  if (!isDevelopment || env.JWT_SECRET?.trim()) return { generatedJwtSecret: false }

  const file = join(stateDir, SECRET_FILE)
  if (!existsSync(file)) {
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(file, `${randomBytes(48).toString('base64url')}\n`, { mode: 0o600 })
  }

  env.JWT_SECRET = readFileSync(file, 'utf8').trim()

  return { generatedJwtSecret: true }
}
