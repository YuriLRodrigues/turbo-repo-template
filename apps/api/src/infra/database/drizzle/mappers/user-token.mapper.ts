import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { UserToken } from '@domain/identity/enterprise/entities/user-token.entity'

import type { NewUserTokenRow, UserTokenRow } from '../schema/user-tokens'

export class UserTokenMapper {
  static toDomain(row: UserTokenRow): UserToken {
    return UserToken.create(
      {
        userId: new UniqueEntityId(row.userId),
        kind: row.kind,
        tokenHash: row.tokenHash,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(token: UserToken): NewUserTokenRow {
    return {
      id: token.id.toString(),
      userId: token.userId.toString(),
      kind: token.kind,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
    }
  }
}
