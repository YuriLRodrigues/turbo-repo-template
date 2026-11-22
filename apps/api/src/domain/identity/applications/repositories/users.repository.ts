import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { User } from '../../enterprise/entities/user.entity'
import type { Email } from '../../enterprise/value-objects/email'

/**
 * Persistence contract of the identity context. The abstract class is also the Nest DI token: the infra layer binds
 * it to the Drizzle implementation (`useClass`), tests use the in-memory one.
 */
export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(email: Email): Promise<User | null>
  /** Newest first. */
  abstract findMany(params: PaginationParams): Promise<Paginated<User>>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
