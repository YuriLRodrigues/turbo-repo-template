import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, right } from '@core/logic/either'
import type { Paginated, PaginationParams } from '@core/pagination/pagination'
import { Clock } from '@core/time/clock'

import type { Session } from '../../enterprise/entities/refresh-token.entity'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'

export type ListSessionsInput = PaginationParams & {
  actor: Actor
}

export type ListSessionsOutput = Either<never, { sessions: Paginated<Session> }>

/** The places where the person is signed in right now (rule 1.3), most recently used first. */
@Injectable()
export class ListSessionsUseCase {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, page, limit }: ListSessionsInput): Promise<ListSessionsOutput> {
    const sessions = await this.refreshTokensRepository.findActiveSessions(actor.id, this.clock.now(), { page, limit })

    return right({ sessions })
  }
}
