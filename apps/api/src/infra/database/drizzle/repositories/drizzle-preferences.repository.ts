import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

import type { PreferencesRepository } from '@domain/identity/applications/repositories/preferences.repository'
import type { Preferences } from '@domain/identity/enterprise/entities/preferences.entity'

import { DrizzleService } from '../drizzle.service'
import { PreferencesMapper } from '../mappers/preferences.mapper'
import { userPreferences } from '../schema/user-preferences'

@Injectable()
export class DrizzlePreferencesRepository implements PreferencesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserId(userId: string): Promise<Preferences | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)

    return row ? PreferencesMapper.toDomain(row) : null
  }

  async save(preferences: Preferences): Promise<void> {
    const { userId, ...values } = PreferencesMapper.toPersistence(preferences, new Date())

    await this.drizzle.db
      .insert(userPreferences)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: userPreferences.userId, set: values })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.drizzle.db.delete(userPreferences).where(eq(userPreferences.userId, userId))
  }
}
