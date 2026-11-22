import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import { SessionNotFoundError } from '../../errors/session-not-found.error'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'

export type RevokeSessionInput = {
  actor: Actor
  sessionId: string
}

export type RevokeSessionOutput = Either<SessionNotFoundError, Record<string, never>>

/**
 * Ends one session of the person: that device cannot renew its access any more. A session of someone else, or one
 * that already ended, answers 404 (rule 0.4).
 */
@Injectable()
export class RevokeSessionUseCase {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, sessionId }: RevokeSessionInput): Promise<RevokeSessionOutput> {
    const now = this.clock.now()
    const session = await this.refreshTokensRepository.findActiveSession(actor.id, sessionId, now)
    if (!session) return left(new SessionNotFoundError())

    await this.refreshTokensRepository.revokeFamily(session.id, now)

    return right({})
  }
}
