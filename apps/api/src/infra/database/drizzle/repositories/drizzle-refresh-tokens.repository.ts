import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, gt, inArray, isNull, lt, min } from 'drizzle-orm'

import { offsetOf, type Paginated, paginated, type PaginationParams } from '@core/pagination/pagination'
import type { RefreshTokensRepository } from '@domain/identity/applications/repositories/refresh-tokens.repository'
import type { RefreshToken, Session } from '@domain/identity/enterprise/entities/refresh-token.entity'

import { DrizzleService } from '../drizzle.service'
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper'
import { type RefreshTokenRow, refreshTokens } from '../schema/refresh-tokens'

@Injectable()
export class DrizzleRefreshTokensRepository implements RefreshTokensRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(token: RefreshToken): Promise<void> {
    await this.drizzle.db.insert(refreshTokens).values(RefreshTokenMapper.toPersistence(token))
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)

    return row ? RefreshTokenMapper.toDomain(row) : null
  }

  async markRotated(tokenId: string, at: Date): Promise<boolean> {
    // The conditions are part of the UPDATE: of two requests with the same token, the database lets one through.
    const rotated = await this.drizzle.db
      .update(refreshTokens)
      .set({ rotatedAt: at })
      .where(and(eq(refreshTokens.id, tokenId), isNull(refreshTokens.rotatedAt), isNull(refreshTokens.revokedAt)))
      .returning({ id: refreshTokens.id })

    return rotated.length === 1
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.drizzle.db
      .update(refreshTokens)
      .set({ revokedAt: at })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)))
  }

  async revokeAllOfUser(userId: string, at: Date): Promise<void> {
    await this.drizzle.db
      .update(refreshTokens)
      .set({ revokedAt: at })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  }

  async findActiveSessions(userId: string, now: Date, params: PaginationParams): Promise<Paginated<Session>> {
    const where = this.alive(userId, now)

    const [rows, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select()
        .from(refreshTokens)
        .where(where)
        .orderBy(desc(refreshTokens.createdAt), desc(refreshTokens.id))
        .limit(params.limit)
        .offset(offsetOf(params)),
      this.drizzle.db.select({ total: count() }).from(refreshTokens).where(where),
    ])

    return paginated(await this.toSessions(rows), total, params)
  }

  async findActiveSession(userId: string, familyId: string, now: Date): Promise<Session | null> {
    const rows = await this.drizzle.db
      .select()
      .from(refreshTokens)
      .where(and(this.alive(userId, now), eq(refreshTokens.familyId, familyId)))
      .limit(1)
    const [session] = await this.toSessions(rows)

    return session ?? null
  }

  async deleteExpiredOfUser(userId: string, before: Date): Promise<void> {
    await this.drizzle.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), lt(refreshTokens.expiresAt, before)))
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    await this.drizzle.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
  }

  /** The token that keeps a session alive: of this person, not exchanged, not revoked, not expired. */
  private alive(userId: string, now: Date) {
    return and(
      eq(refreshTokens.userId, userId),
      isNull(refreshTokens.rotatedAt),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, now),
    )
  }

  /** A session started when the first token of its family was issued. */
  private async toSessions(rows: RefreshTokenRow[]): Promise<Session[]> {
    if (rows.length === 0) return []

    const families = await this.drizzle.db
      .select({ familyId: refreshTokens.familyId, startedAt: min(refreshTokens.createdAt) })
      .from(refreshTokens)
      .where(
        inArray(
          refreshTokens.familyId,
          rows.map((row) => row.familyId),
        ),
      )
      .groupBy(refreshTokens.familyId)
    const startedAt = new Map(families.map((family) => [family.familyId, family.startedAt]))

    return rows.map((row) => ({
      id: row.familyId,
      userId: row.userId,
      createdAt: startedAt.get(row.familyId) ?? row.createdAt,
      lastUsedAt: row.createdAt,
      expiresAt: row.expiresAt,
      userAgent: row.userAgent,
    }))
  }
}
