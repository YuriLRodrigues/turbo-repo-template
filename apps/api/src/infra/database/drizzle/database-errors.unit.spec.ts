import { describe, expect, it } from 'vitest'

import { databaseErrorMessage, isMissingUserViolation } from './database-errors'

/** An error the way `pg` raises it: the SQLSTATE in `code`, the constraint by name. */
function postgresError(message: string, code: string, constraint?: string): Error {
  return Object.assign(new Error(message), { code, constraint })
}

/** The way Drizzle hands it over: its own error, with the statement as the message and the driver's as the cause. */
const wrapped = (cause: unknown): Error => new Error('Failed query: insert into "notes" ("id") values ($1)', { cause })

describe('databaseErrorMessage', () => {
  it('answers the reason of the driver, not the statement Drizzle wraps it in', () => {
    expect(databaseErrorMessage(wrapped(new Error('connect ECONNREFUSED 127.0.0.1:5432')))).toBe(
      'connect ECONNREFUSED 127.0.0.1:5432',
    )
    expect(databaseErrorMessage(wrapped(postgresError('relation "notes" does not exist', '42P01')))).toBe(
      'relation "notes" does not exist',
    )
  })

  it('reads the reasons of a connection that failed on more than one address', () => {
    const refused = new AggregateError(
      [new Error('connect ECONNREFUSED ::1:5432'), new Error('connect ECONNREFUSED 127.0.0.1:5432')],
      '',
    )

    expect(databaseErrorMessage(wrapped(refused))).toBe(
      'connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432',
    )
  })

  it('keeps the message of an error that wraps nothing, and always answers something', () => {
    expect(databaseErrorMessage(new Error('the pool is closed'))).toBe('the pool is closed')
    expect(databaseErrorMessage(wrapped(new Error('')))).toBe('Failed query: insert into "notes" ("id") values ($1)')
    expect(databaseErrorMessage(new TypeError(''))).toBe('TypeError')
    expect(databaseErrorMessage('boom')).toBe('boom')
  })

  it('does not follow a chain of causes forever', () => {
    const loop = new Error('first')
    loop.cause = new Error('second', { cause: loop })

    expect(databaseErrorMessage(loop)).toBe('first')
  })
})

describe('isMissingUserViolation', () => {
  const missingUser = postgresError(
    'insert or update on table "notes" violates foreign key constraint "notes_user_id_users_id_fkey"',
    '23503',
    'notes_user_id_users_id_fkey',
  )

  it('recognises a write for a user that no longer exists, also under the error of Drizzle', () => {
    expect(isMissingUserViolation(missingUser)).toBe(true)
    expect(isMissingUserViolation(wrapped(missingUser))).toBe(true)
    expect(isMissingUserViolation(postgresError('...', '23503', 'user_preferences_user_id_users_id_fkey'))).toBe(true)
  })

  it('is not fooled by another foreign key, another violation or another kind of error', () => {
    expect(isMissingUserViolation(postgresError('...', '23503', 'refresh_tokens_family_id_fkey'))).toBe(false)
    expect(isMissingUserViolation(postgresError('...', '23505', 'notes_user_id_users_id_fkey'))).toBe(false)
    expect(isMissingUserViolation(postgresError('...', '23503'))).toBe(false)
    expect(isMissingUserViolation(wrapped(new Error('connect ECONNREFUSED 127.0.0.1:5432')))).toBe(false)
    expect(isMissingUserViolation(new Error('boom'))).toBe(false)
    expect(isMissingUserViolation(undefined)).toBe(false)
  })
})
