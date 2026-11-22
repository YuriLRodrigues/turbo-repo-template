import { Entity } from '@core/domain/entity'
import { UniqueEntityId } from '@core/domain/unique-entity-id'

import { REFRESH_TOKEN_TTL_MS } from '../identity-rules'

export type RefreshTokenProps = {
  userId: UniqueEntityId
  /** Every token that descends from the same sign-in shares it: the family is the session. */
  familyId: UniqueEntityId
  /** The token itself is never stored (rule 1.3). */
  tokenHash: string
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
  /** Set when it was exchanged for the next token of the family. */
  rotatedAt: Date | null
  revokedAt: Date | null
}

export const USER_AGENT_MAX_LENGTH = 255

export type IssueRefreshTokenInput = {
  userId: UniqueEntityId
  tokenHash: string
  now: Date
  /** Absent on sign-in: a new family starts. */
  familyId?: UniqueEntityId
  userAgent?: string | null
}

export class RefreshToken extends Entity<RefreshTokenProps> {
  get userId(): UniqueEntityId {
    return this.props.userId
  }

  get familyId(): UniqueEntityId {
    return this.props.familyId
  }

  get tokenHash(): string {
    return this.props.tokenHash
  }

  get userAgent(): string | null {
    return this.props.userAgent
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get rotatedAt(): Date | null {
    return this.props.rotatedAt
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt
  }

  get isRotated(): boolean {
    return this.props.rotatedAt !== null
  }

  get isRevoked(): boolean {
    return this.props.revokedAt !== null
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime()
  }

  /** A new token valid for 30 days (rule 1.3), in a new family or in the one being rotated. */
  static issue({ userId, tokenHash, now, familyId, userAgent }: IssueRefreshTokenInput): RefreshToken {
    return new RefreshToken({
      userId,
      familyId: familyId ?? new UniqueEntityId(),
      tokenHash,
      userAgent: userAgent?.trim().slice(0, USER_AGENT_MAX_LENGTH) || null,
      createdAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      rotatedAt: null,
      revokedAt: null,
    })
  }

  /** Rebuilds a token that already exists (mappers, factories). */
  static create(props: RefreshTokenProps, id?: UniqueEntityId): RefreshToken {
    return new RefreshToken(props, id)
  }
}

/**
 * A session as the person sees it in the list: one sign-in on one device, alive while its family has a token that
 * was not exchanged, revoked or left to expire.
 */
export type Session = {
  /** The family id. */
  id: string
  userId: string
  /** When the person signed in. */
  createdAt: Date
  /** When the session last got a new token. */
  lastUsedAt: Date
  expiresAt: Date
  userAgent: string | null
}
