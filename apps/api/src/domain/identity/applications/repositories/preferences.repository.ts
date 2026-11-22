import type { Preferences } from '../../enterprise/entities/preferences.entity'

/** Rule 1.7. A person who never changed anything has no row: the use cases answer with the defaults. */
export abstract class PreferencesRepository {
  abstract findByUserId(userId: string): Promise<Preferences | null>
  /** Creates the row or replaces it. */
  abstract save(preferences: Preferences): Promise<void>
  /** Rule 1.6. */
  abstract deleteByUserId(userId: string): Promise<void>
}
