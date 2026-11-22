import { Injectable } from '@nestjs/common'

import type { UniqueEntityId } from '@core/domain/unique-entity-id'

import { RefreshToken } from '../../enterprise/entities/refresh-token.entity'
import type { User } from '../../enterprise/entities/user.entity'
import { Encrypter } from '../cryptography/encrypter'
import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'

/** What a client receives when it signs in or renews its session (rule 1.3). */
export type SessionTokens = {
  /** Short JWT: `Authorization: Bearer <accessToken>`. */
  accessToken: string
  /** Opaque, single use: exchanging it returns the next one. */
  refreshToken: string
  refreshTokenExpiresAt: Date
  /** The id of the session in `GET /me/sessions`. */
  sessionId: string
}

export type IssueSessionInput = {
  now: Date
  userAgent?: string | null
  /** The session being renewed. Absent on sign-in, which starts a new one. */
  familyId?: UniqueEntityId
}

/**
 * Issues the pair of tokens: stores the hash of a new refresh token and signs an access token that carries the
 * session id. Shared by sign-in and refresh; it is a helper, not a use case.
 */
@Injectable()
export class SessionIssuer {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly encrypter: Encrypter,
  ) {}

  async issue(user: User, { now, userAgent, familyId }: IssueSessionInput): Promise<SessionTokens> {
    const { token, hash } = this.opaqueTokens.issue()
    const refreshToken = RefreshToken.issue({ userId: user.id, tokenHash: hash, now, familyId, userAgent })
    await this.refreshTokensRepository.create(refreshToken)

    const sessionId = refreshToken.familyId.toString()
    const accessToken = await this.encrypter.encrypt({ sub: user.id.toString(), role: user.role, sid: sessionId })

    return { accessToken, refreshToken: token, refreshTokenExpiresAt: refreshToken.expiresAt, sessionId }
  }
}
