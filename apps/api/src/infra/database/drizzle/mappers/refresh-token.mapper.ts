import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { RefreshToken } from '@domain/identity/enterprise/entities/refresh-token.entity'

import type { NewRefreshTokenRow, RefreshTokenRow } from '../schema/refresh-tokens'

export class RefreshTokenMapper {
  static toDomain(row: RefreshTokenRow): RefreshToken {
    return RefreshToken.create(
      {
        userId: new UniqueEntityId(row.userId),
        familyId: new UniqueEntityId(row.familyId),
        tokenHash: row.tokenHash,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        rotatedAt: row.rotatedAt,
        revokedAt: row.revokedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(token: RefreshToken): NewRefreshTokenRow {
    return {
      id: token.id.toString(),
      userId: token.userId.toString(),
      familyId: token.familyId.toString(),
      tokenHash: token.tokenHash,
      userAgent: token.userAgent,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      rotatedAt: token.rotatedAt,
      revokedAt: token.revokedAt,
    }
  }
}
