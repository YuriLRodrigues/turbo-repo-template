import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { User } from '@domain/identity/enterprise/entities/user.entity'
import { Email } from '@domain/identity/enterprise/value-objects/email'

import type { NewUserRow, UserRow } from '../schema/users'

/** The only place that knows both the table and the entity. */
export class UserMapper {
  static toDomain(row: UserRow): User {
    return User.create(
      {
        name: row.name,
        email: Email.restore(row.email),
        passwordHash: row.passwordHash,
        role: row.role,
        emailVerifiedAt: row.emailVerifiedAt,
        createdAt: row.createdAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(user: User): NewUserRow {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email.value,
      passwordHash: user.passwordHash,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    }
  }
}
