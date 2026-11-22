import type { Paginated } from '@core/pagination/pagination'
import type { Session } from '@domain/identity/enterprise/entities/refresh-token.entity'

import type { SessionResponseDto, SessionsPageResponseDto } from '../dtos/session-response.dto'

/** The HTTP shape of a session. Nothing about its tokens leaves the server. */
export class SessionViewModel {
  static toHttp(session: Session, currentSessionId: string): SessionResponseDto {
    return {
      id: session.id,
      current: session.id === currentSessionId,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    }
  }

  static toHttpPage({ results, meta }: Paginated<Session>, currentSessionId: string): SessionsPageResponseDto {
    return { results: results.map((session) => SessionViewModel.toHttp(session, currentSessionId)), meta }
  }
}
