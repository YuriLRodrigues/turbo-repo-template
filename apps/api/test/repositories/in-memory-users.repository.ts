import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated, type PaginationParams } from '@core/pagination/pagination'
import type { UsersRepository } from '@domain/identity/applications/repositories/users.repository'
import type { User } from '@domain/identity/enterprise/entities/user.entity'
import type { Email } from '@domain/identity/enterprise/value-objects/email'

export class InMemoryUsersRepository implements UsersRepository {
  items: User[] = []

  async findById(id: string): Promise<User | null> {
    return this.items.find((user) => user.id.toString() === id) ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.items.find((user) => user.email.equals(email)) ?? null
  }

  async findMany(params: PaginationParams): Promise<Paginated<User>> {
    const sorted = [...this.items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const offset = offsetOf(params)

    return paginated(sorted.slice(offset, offset + params.limit), sorted.length, params)
  }

  async create(user: User): Promise<void> {
    this.items.push(user)
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }

  async save(user: User): Promise<void> {
    this.items = this.items.map((current) => (current.id.equals(user.id) ? user : current))
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }

  async delete(user: User): Promise<void> {
    this.items = this.items.filter((current) => !current.id.equals(user.id))
    await DomainEvents.dispatchEventsForAggregate(user.id)
  }
}
