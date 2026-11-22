import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'
import { UnitOfWork } from '@core/persistence/unit-of-work'
import { Clock } from '@core/time/clock'

import type { User } from '../../enterprise/entities/user.entity'
import { RefreshTokenExpiredError } from '../../errors/refresh-token-expired.error'
import { RefreshTokenInvalidError } from '../../errors/refresh-token-invalid.error'
import { RefreshTokenReusedError } from '../../errors/refresh-token-reused.error'
import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'
import { SessionIssuer, type SessionTokens } from '../services/session-issuer'

export type RefreshSessionInput = {
  /** From the cookie or from the `x-refresh-token` header. */
  refreshToken: string | undefined
  userAgent?: string | null
}

export type RefreshSessionOutput = Either<
  RefreshTokenInvalidError | RefreshTokenExpiredError | RefreshTokenReusedError,
  { user: User; tokens: SessionTokens }
>

/**
 * Rule 1.3: exchanges a refresh token for a new pair. A token works once. Showing an exchanged token again (or
 * losing the race against another request with the same token) is treated as theft: the whole family is revoked.
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly usersRepository: UsersRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly sessionIssuer: SessionIssuer,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ refreshToken, userAgent }: RefreshSessionInput): Promise<RefreshSessionOutput> {
    if (!refreshToken) return left(new RefreshTokenInvalidError())

    const now = this.clock.now()
    const current = await this.refreshTokensRepository.findByHash(this.opaqueTokens.hash(refreshToken))
    if (!current || current.isRevoked) return left(new RefreshTokenInvalidError())

    const familyId = current.familyId.toString()
    if (current.isRotated) {
      await this.refreshTokensRepository.revokeFamily(familyId, now)

      return left(new RefreshTokenReusedError())
    }

    if (current.isExpired(now)) return left(new RefreshTokenExpiredError())

    const user = await this.usersRepository.findById(current.userId.toString())
    if (!user) return left(new RefreshTokenInvalidError())

    const tokens = await this.unitOfWork.run(async () => {
      const rotated = await this.refreshTokensRepository.markRotated(current.id.toString(), now)
      if (!rotated) return null

      return this.sessionIssuer.issue(user, {
        now,
        familyId: current.familyId,
        userAgent: userAgent ?? current.userAgent,
      })
    })

    if (!tokens) {
      await this.refreshTokensRepository.revokeFamily(familyId, now)

      return left(new RefreshTokenReusedError())
    }

    return right({ user, tokens })
  }
}
