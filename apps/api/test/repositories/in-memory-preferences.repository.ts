import type { PreferencesRepository } from '@domain/identity/applications/repositories/preferences.repository'
import type { Preferences } from '@domain/identity/enterprise/entities/preferences.entity'

export class InMemoryPreferencesRepository implements PreferencesRepository {
  items: Preferences[] = []

  async findByUserId(userId: string): Promise<Preferences | null> {
    return this.items.find((preferences) => preferences.userId.toString() === userId) ?? null
  }

  async save(preferences: Preferences): Promise<void> {
    this.items = [...this.items.filter((current) => !current.userId.equals(preferences.userId)), preferences]
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.items = this.items.filter((preferences) => preferences.userId.toString() !== userId)
  }
}
