import { Injectable } from '@nestjs/common'
import { and, desc, eq, isNull } from 'drizzle-orm'

import type { UserTokensRepository } from '@domain/identity/applications/repositories/user-tokens.repository'
import type { UserToken } from '@domain/identity/enterprise/entities/user-token.entity'
import type { UserTokenKind } from '@domain/identity/enterprise/user-token-kind'

import { DrizzleService } from '../drizzle.service'
import { UserTokenMapper } from '../mappers/user-token.mapper'
import { userTokens } from '../schema/user-tokens'

@Injectable()
export class DrizzleUserTokensRepository implements UserTokensRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(token: UserToken): Promise<void> {
    await this.drizzle.db.insert(userTokens).values(UserTokenMapper.toPersistence(token))
  }

  async findByHash(kind: UserTokenKind, tokenHash: string): Promise<UserToken | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(userTokens)
      .where(and(eq(userTokens.kind, kind), eq(userTokens.tokenHash, tokenHash)))
      .limit(1)

    return row ? UserTokenMapper.toDomain(row) : null
  }

  async findLatest(userId: string, kind: UserTokenKind): Promise<UserToken | null> {
    const [row] = await this.drizzle.db
      .select()
      .from(userTokens)
      .where(and(eq(userTokens.userId, userId), eq(userTokens.kind, kind)))
      .orderBy(desc(userTokens.createdAt), desc(userTokens.id))
      .limit(1)

    return row ? UserTokenMapper.toDomain(row) : null
  }

  async save(token: UserToken): Promise<void> {
    const { id, ...changes } = UserTokenMapper.toPersistence(token)

    await this.drizzle.db.update(userTokens).set(changes).where(eq(userTokens.id, id))
  }

  async invalidateAll(userId: string, kind: UserTokenKind, at: Date): Promise<void> {
    await this.drizzle.db
      .update(userTokens)
      .set({ usedAt: at })
      .where(and(eq(userTokens.userId, userId), eq(userTokens.kind, kind), isNull(userTokens.usedAt)))
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    await this.drizzle.db.delete(userTokens).where(eq(userTokens.userId, userId))
  }
}
