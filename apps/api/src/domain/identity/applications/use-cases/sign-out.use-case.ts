import { Injectable } from '@nestjs/common'

import { type Either, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'

export type SignOutInput = {
  /** From the cookie or from the `x-refresh-token` header. */
  refreshToken: string | undefined
}

export type SignOutOutput = Either<never, Record<string, never>>

/**
 * Rule 1.3: signing out revokes the family of the refresh token. It never fails: without a token, or with one
 * that is unknown or already revoked, there is nothing left to end.
 */
@Injectable()
export class SignOutUseCase {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly clock: Clock,
  ) {}

  async execute({ refreshToken }: SignOutInput): Promise<SignOutOutput> {
    if (!refreshToken) return right({})

    const token = await this.refreshTokensRepository.findByHash(this.opaqueTokens.hash(refreshToken))
    if (token) await this.refreshTokensRepository.revokeFamily(token.familyId.toString(), this.clock.now())

    return right({})
  }
}
