import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Relative import on purpose: drizzle-kit loads this file outside of Nest and does not read tsconfig paths.
import { roles } from '../../../../core/auth/actor'

export const userRoleEnum = pgEnum('user_role', roles)

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('USER'),
  /** Rule 1.2: empty until the link sent by e-mail is opened. */
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
