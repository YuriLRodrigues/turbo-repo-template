import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { RefreshToken, Session } from '../../enterprise/entities/refresh-token.entity'

/** Rule 1.3. Tokens are looked up by their hash; the token itself never reaches a repository. */
export abstract class RefreshTokensRepository {
  abstract create(token: RefreshToken): Promise<void>
  abstract findByHash(tokenHash: string): Promise<RefreshToken | null>

  /**
   * Marks the token as exchanged, but only if nobody did it first and it was not revoked: one statement, so two
   * requests with the same token cannot both win. `false` means the race was lost, which counts as reuse.
   */
  abstract markRotated(tokenId: string, at: Date): Promise<boolean>

  /** Ends one session. Idempotent. */
  abstract revokeFamily(familyId: string, at: Date): Promise<void>
  /** Ends every session of a person (rule 1.5). */
  abstract revokeAllOfUser(userId: string, at: Date): Promise<void>

  /** The sessions that are alive at `now`, most recently used first. */
  abstract findActiveSessions(userId: string, now: Date, params: PaginationParams): Promise<Paginated<Session>>
  abstract findActiveSession(userId: string, familyId: string, now: Date): Promise<Session | null>

  /** Housekeeping: drops the rows of this person that expired before `before`. */
  abstract deleteExpiredOfUser(userId: string, before: Date): Promise<void>
  /** Rule 1.6. */
  abstract deleteAllOfUser(userId: string): Promise<void>
}
