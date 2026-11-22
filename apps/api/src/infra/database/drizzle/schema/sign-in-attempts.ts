import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Rule 1.4: one row per wrong password, by e-mail. It lives in the database so the limit holds when the API runs
 * on more than one instance. The e-mail is not a foreign key: an address without an account is counted the same
 * way, or the limit would reveal who has one.
 */
export const signInAttempts = pgTable(
  'sign_in_attempts',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('sign_in_attempts_email_attempted_at_idx').on(table.email, table.attemptedAt)],
)

export type SignInAttemptRow = typeof signInAttempts.$inferSelect
