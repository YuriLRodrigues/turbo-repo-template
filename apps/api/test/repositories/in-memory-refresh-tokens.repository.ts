import { offsetOf, type Paginated, paginated, type PaginationParams } from '@core/pagination/pagination'
import type { RefreshTokensRepository } from '@domain/identity/applications/repositories/refresh-tokens.repository'
import { RefreshToken, type Session } from '@domain/identity/enterprise/entities/refresh-token.entity'

type Patch = { rotatedAt?: Date; revokedAt?: Date }

/** Same contract as the Drizzle repository, including the single-winner rotation. */
export class InMemoryRefreshTokensRepository implements RefreshTokensRepository {
  items: RefreshToken[] = []

  async create(token: RefreshToken): Promise<void> {
    this.items.push(token)
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.items.find((token) => token.tokenHash === tokenHash) ?? null
  }

  async markRotated(tokenId: string, at: Date): Promise<boolean> {
    const token = this.items.find((item) => item.id.toString() === tokenId)
    if (!token || token.isRotated || token.isRevoked) return false

    this.patch(token, { rotatedAt: at })

    return true
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    for (const token of this.items) {
      if (token.familyId.toString() === familyId && !token.isRevoked) this.patch(token, { revokedAt: at })
    }
  }

  async revokeAllOfUser(userId: string, at: Date): Promise<void> {
    for (const token of this.items) {
      if (token.userId.toString() === userId && !token.isRevoked) this.patch(token, { revokedAt: at })
    }
  }

  async findActiveSessions(userId: string, now: Date, params: PaginationParams): Promise<Paginated<Session>> {
    const sessions = this.sessionsOf(userId, now).sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    const offset = offsetOf(params)

    return paginated(sessions.slice(offset, offset + params.limit), sessions.length, params)
  }

  async findActiveSession(userId: string, familyId: string, now: Date): Promise<Session | null> {
    return this.sessionsOf(userId, now).find((session) => session.id === familyId) ?? null
  }

  async deleteExpiredOfUser(userId: string, before: Date): Promise<void> {
    this.items = this.items.filter((token) => token.userId.toString() !== userId || !token.isExpired(before))
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    this.items = this.items.filter((token) => token.userId.toString() !== userId)
  }

  /** What a test reads back: the stored token of a hash, with its latest state. */
  byHash(tokenHash: string): RefreshToken | undefined {
    return this.items.find((token) => token.tokenHash === tokenHash)
  }

  private sessionsOf(userId: string, now: Date): Session[] {
    return this.items
      .filter((token) => token.userId.toString() === userId)
      .filter((token) => !token.isRotated && !token.isRevoked && !token.isExpired(now))
      .map((token) => {
        const family = this.items.filter((item) => item.familyId.equals(token.familyId))

        return {
          id: token.familyId.toString(),
          userId,
          createdAt: new Date(Math.min(...family.map((item) => item.createdAt.getTime()))),
          lastUsedAt: token.createdAt,
          expiresAt: token.expiresAt,
          userAgent: token.userAgent,
        }
      })
  }

  private patch(token: RefreshToken, patch: Patch): void {
    const next = RefreshToken.create(
      {
        userId: token.userId,
        familyId: token.familyId,
        tokenHash: token.tokenHash,
        userAgent: token.userAgent,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        rotatedAt: patch.rotatedAt ?? token.rotatedAt,
        revokedAt: patch.revokedAt ?? token.revokedAt,
      },
      token.id,
    )
    this.items = this.items.map((item) => (item.id.equals(token.id) ? next : item))
  }
}
