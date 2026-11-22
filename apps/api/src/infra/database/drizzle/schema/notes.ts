import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { users } from './users'

/**
 * Rule 2.1. The list (rule 2.3) reads the notes of one owner, archived or not, pinned first and the most recently
 * changed after: the index follows that `where` + `order by`.
 */
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey(),
    // `user_id`: every table points to its owner by this name (`isMissingUserViolation` reads the constraint).
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    body: text('body'),
    pinned: boolean('pinned').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('notes_user_id_pinned_updated_at_idx').on(table.userId, table.pinned, table.updatedAt)],
)

export type NoteRow = typeof notes.$inferSelect
export type NewNoteRow = typeof notes.$inferInsert
