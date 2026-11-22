/** Postgres error codes (the SQLSTATE the driver puts in `code`). */
const FOREIGN_KEY_VIOLATION = '23503'

type PostgresError = { code?: unknown; constraint?: unknown; cause?: unknown }

/** Drizzle wraps the driver's error: the Postgres one is somewhere down the `cause` chain. */
function findPostgresError(error: unknown): PostgresError | undefined {
  let current = error

  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth++) {
    const candidate = current as PostgresError
    if (typeof candidate.code === 'string' && /^[0-9A-Z]{5}$/.test(candidate.code)) return candidate
    current = candidate.cause
  }

  return undefined
}

const MAX_CAUSES = 5

/** What one error of the chain has to say. A failed connection to several addresses has its reasons in `errors`. */
function ownMessageOf(error: Error): string {
  if (error.message) return error.message
  if (error instanceof AggregateError) {
    return error.errors
      .map((inner: unknown) => (inner instanceof Error ? inner.message : String(inner)))
      .filter(Boolean)
      .join('; ')
  }

  return ''
}

/**
 * Why a query failed, in the words of the driver. Drizzle wraps every failure in an error whose message is the
 * whole statement (`Failed query: insert into ...`); the reason (`connect ECONNREFUSED 127.0.0.1:5432`,
 * `relation "notes" does not exist`) is at the end of the `cause` chain. For the boot checklist and for log
 * lines; the full error, with its stack, still goes to `logger.error` where one is wanted.
 */
export function databaseErrorMessage(error: unknown): string {
  let message = ''
  let current = error

  for (let depth = 0; depth < MAX_CAUSES && current instanceof Error; depth++) {
    message = ownMessageOf(current) || message
    current = current.cause
  }

  return message || (error instanceof Error ? error.name : String(error))
}

/** Every table points to its owner with a foreign key named `<table>_user_id_users_id_fkey`. */
const USER_FOREIGN_KEY = /_user_id_users_id_fk/

/**
 * True when a write failed because the user it belongs to does not exist. It happens in one situation: the account
 * was deleted and a request arrived with an access token that had not expired yet.
 */
export function isMissingUserViolation(error: unknown): boolean {
  const postgresError = findPostgresError(error)

  return (
    postgresError?.code === FOREIGN_KEY_VIOLATION &&
    typeof postgresError.constraint === 'string' &&
    USER_FOREIGN_KEY.test(postgresError.constraint)
  )
}
