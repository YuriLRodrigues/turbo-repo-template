import { index, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { userTokenKinds } from '../../../../domain/identity/enterprise/user-token-kind'
import { users } from './users'

export const userTokenKindEnum = pgEnum('user_token_kind', userTokenKinds)

/** The single-use links sent by e-mail (rules 1.2 and 1.5). Only the SHA-256 of the token is kept. */
export const userTokens = pgTable(
  'user_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: userTokenKindEnum('kind').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** Set when the link was opened, or when a newer link replaced it. */
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [index('user_tokens_user_id_kind_created_at_idx').on(table.userId, table.kind, table.createdAt.desc())],
)

export type UserTokenRow = typeof userTokens.$inferSelect
export type NewUserTokenRow = typeof userTokens.$inferInsert
