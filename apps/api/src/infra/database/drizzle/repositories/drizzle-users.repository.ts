import { Injectable } from '@nestjs/common'
import { count, desc, eq } from 'drizzle-orm'

import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated, type PaginationParams } from '@core/pagination/pagination'
import type { UsersRepository } from '@domain/identity/applications/repositories/users.repository'
import type { User } from '@domain/identity/enterprise/entities/user.entity'
import type { Email } from '@domain/identity/enterprise/value-objects/email'

import { DrizzleService } from '../drizzle.service'
import { UserMapper } from '../mappers/user.mapper'
import { users } from '../schema/users'

@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.drizzle.db.select().from(users).where(eq(users.id, id)).limit(1)
    return row ? UserMapper.toDomain(row) : null
  }

  async findByEmail(email: Email): Promise<User | null> {
    const [row] = await this.drizzle.db.select().from(users).where(eq(users.email, email.value)).limit(1)
    return row ? UserMapper.toDomain(row) : null
  }

  async findMany(params: PaginationParams): Promise<Paginated<User>> {
    const [rows, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt), desc(users.id))
        .limit(params.limit)
        .offset(offsetOf(params)),
      this.drizzle.db.select({ total: count() }).from(users),
    ])

    return paginated(
      rows.map((row) => UserMapper.toDomain(row)),
      total,
      params,
    )
  }

  async create(user: User): Promise<void> {
    await this.drizzle.db.insert(users).values(UserMapper.toPersistence(user))
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }

  async save(user: User): Promise<void> {
    const { id, ...changes } = UserMapper.toPersistence(user)

    await this.drizzle.db.update(users).set(changes).where(eq(users.id, id))
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }

  async delete(user: User): Promise<void> {
    await this.drizzle.db.delete(users).where(eq(users.id, user.id.toString()))
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }
}
