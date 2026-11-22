import type { Role } from '@core/auth/actor'
import { AggregateRoot } from '@core/domain/aggregate-root'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { Optional } from '@core/logic/optional'

import type { Email } from '../value-objects/email'

export type UserProps = {
  name: string
  email: Email
  passwordHash: string
  role: Role
  /** Rule 1.2: empty until the person opens the link sent by e-mail. */
  emailVerifiedAt: Date | null
  createdAt: Date
}

export class User extends AggregateRoot<UserProps> {
  get name(): string {
    return this.props.name
  }

  get email(): Email {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get role(): Role {
    return this.props.role
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  /** Confirming twice keeps the first date. */
  verifyEmail(now: Date): void {
    this.props.emailVerifiedAt ??= now
  }

  changePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash
  }

  static create(props: Optional<UserProps, 'role' | 'createdAt' | 'emailVerifiedAt'>, id?: UniqueEntityId): User {
    return new User(
      {
        ...props,
        role: props.role ?? 'USER',
        emailVerifiedAt: props.emailVerifiedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
