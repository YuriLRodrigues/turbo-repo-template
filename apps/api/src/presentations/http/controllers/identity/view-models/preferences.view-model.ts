import type { Preferences } from '@domain/identity/enterprise/entities/preferences.entity'

import type { PreferencesResponseDto } from '../dtos/preferences.dto'

export class PreferencesViewModel {
  static toHttp(preferences: Preferences): PreferencesResponseDto {
    return {
      appearance: { ...preferences.appearance },
      timeZone: preferences.timeZone,
      onboarding: {
        ...preferences.onboarding,
        completedSteps: [...preferences.onboarding.completedSteps],
        skippedSteps: [...preferences.onboarding.skippedSteps],
      },
      updatedAt: preferences.updatedAt?.toISOString() ?? null,
    }
  }
}
