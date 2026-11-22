import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Preferences } from '@domain/identity/enterprise/entities/preferences.entity'
import type { Appearance } from '@domain/identity/enterprise/preferences/appearance'
import { restoreOnboarding } from '@domain/identity/enterprise/preferences/onboarding'

import type { NewUserPreferencesRow, UserPreferencesRow } from '../schema/user-preferences'

export class PreferencesMapper {
  static toDomain(row: UserPreferencesRow): Preferences {
    return Preferences.create(
      {
        // Validated by the domain before it was written: the columns are plain text on purpose.
        appearance: {
          theme: row.theme,
          accent: row.accent,
          density: row.density,
          reduceMotion: row.reduceMotion,
        } as Appearance,
        timeZone: row.timeZone,
        onboarding: restoreOnboarding(row.onboarding),
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.userId),
    )
  }

  static toPersistence(preferences: Preferences, now: Date): NewUserPreferencesRow {
    return {
      userId: preferences.userId.toString(),
      ...preferences.appearance,
      timeZone: preferences.timeZone,
      onboarding: preferences.onboarding,
      updatedAt: preferences.updatedAt ?? now,
    }
  }
}
