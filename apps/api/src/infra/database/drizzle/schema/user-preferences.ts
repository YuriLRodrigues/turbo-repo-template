import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import type { OnboardingState } from '../../../../domain/identity/enterprise/preferences/onboarding'
import { users } from './users'

/**
 * Rule 1.7. The appearance values are plain text checked by the domain (they follow the lists of the design
 * system, which grow without a migration). A person without a row has the defaults.
 */
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 20 }).notNull(),
  accent: varchar('accent', { length: 20 }).notNull(),
  density: varchar('density', { length: 20 }).notNull(),
  reduceMotion: boolean('reduce_motion').notNull().default(false),
  timeZone: varchar('time_zone', { length: 64 }).notNull(),
  onboarding: jsonb('onboarding').$type<OnboardingState>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserPreferencesRow = typeof userPreferences.$inferSelect
export type NewUserPreferencesRow = typeof userPreferences.$inferInsert
