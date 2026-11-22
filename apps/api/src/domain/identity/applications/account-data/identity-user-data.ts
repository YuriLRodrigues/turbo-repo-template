import { Injectable } from '@nestjs/common'

import { Clock } from '@core/time/clock'

import { PreferencesRepository } from '../repositories/preferences.repository'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'
import { SignInAttemptsRepository } from '../repositories/sign-in-attempts.repository'
import { UserTokensRepository } from '../repositories/user-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'
import { UserDataContributor } from './user-data-contributor'

/** How many sessions the export lists: far more than anyone keeps open. */
const SESSIONS_IN_EXPORT = 100

/**
 * Identity's own part of rule 1.6: the profile, the preferences and the open sessions. Secrets are never exported
 * (password hash, token hashes). The user row itself is deleted by the use case, after every contributor ran.
 */
@Injectable()
export class IdentityUserData extends UserDataContributor {
  readonly section = 'identity'

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly preferencesRepository: PreferencesRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly userTokensRepository: UserTokensRepository,
    private readonly signInAttemptsRepository: SignInAttemptsRepository,
    private readonly clock: Clock,
  ) {
    super()
  }

  async export(userId: string): Promise<Record<string, unknown>> {
    const [user, preferences, sessions] = await Promise.all([
      this.usersRepository.findById(userId),
      this.preferencesRepository.findByUserId(userId),
      this.refreshTokensRepository.findActiveSessions(userId, this.clock.now(), {
        page: 1,
        limit: SESSIONS_IN_EXPORT,
      }),
    ])

    return {
      profile: user
        ? {
            id: user.id.toString(),
            name: user.name,
            email: user.email.value,
            emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
            createdAt: user.createdAt.toISOString(),
          }
        : null,
      preferences: preferences
        ? {
            appearance: preferences.appearance,
            timeZone: preferences.timeZone,
            onboarding: preferences.onboarding,
            updatedAt: preferences.updatedAt?.toISOString() ?? null,
          }
        : null,
      sessions: sessions.results.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        userAgent: session.userAgent,
      })),
    }
  }

  async erase(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId)

    await this.refreshTokensRepository.deleteAllOfUser(userId)
    await this.userTokensRepository.deleteAllOfUser(userId)
    await this.preferencesRepository.deleteByUserId(userId)
    if (user) await this.signInAttemptsRepository.clear(user.email.value)
  }
}
