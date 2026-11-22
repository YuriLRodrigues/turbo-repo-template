import { Entity } from '@core/domain/entity'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'

import { EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS } from '../identity-rules'
import type { UserTokenKind } from '../user-token-kind'

export type UserTokenProps = {
  userId: UniqueEntityId
  kind: UserTokenKind
  /** The token itself travels only inside the e-mail. */
  tokenHash: string
  createdAt: Date
  expiresAt: Date
  /** Set when the link was opened, or when a newer link took its place. */
  usedAt: Date | null
}

const TTL_MS: Record<UserTokenKind, number> = {
  email_verification: EMAIL_VERIFICATION_TTL_MS,
  password_reset: PASSWORD_RESET_TTL_MS,
}

/** A single-use link sent by e-mail: confirm the address (rule 1.2) or choose a new password (rule 1.5). */
export class UserToken extends Entity<UserTokenProps> {
  get userId(): UniqueEntityId {
    return this.props.userId
  }

  get kind(): UserTokenKind {
    return this.props.kind
  }

  get tokenHash(): string {
    return this.props.tokenHash
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get usedAt(): Date | null {
    return this.props.usedAt
  }

  get isUsed(): boolean {
    return this.props.usedAt !== null
  }

  isExpired(now: Date): boolean {
    return this.props.expiresAt.getTime() <= now.getTime()
  }

  use(now: Date): void {
    this.props.usedAt ??= now
  }

  /** A new link, valid for 24 hours (confirmation) or 1 hour (password). */
  static issue(input: { userId: UniqueEntityId; kind: UserTokenKind; tokenHash: string; now: Date }): UserToken {
    return new UserToken({
      userId: input.userId,
      kind: input.kind,
      tokenHash: input.tokenHash,
      createdAt: input.now,
      expiresAt: new Date(input.now.getTime() + TTL_MS[input.kind]),
      usedAt: null,
    })
  }

  /** Rebuilds a token that already exists (mappers, factories). */
  static create(props: UserTokenProps, id?: UniqueEntityId): UserToken {
    return new UserToken(props, id)
  }
}
