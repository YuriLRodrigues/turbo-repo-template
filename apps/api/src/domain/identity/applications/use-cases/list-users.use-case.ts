import { Injectable } from '@nestjs/common'

import { type Either, right } from '@core/logic/either'
import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { User } from '../../enterprise/entities/user.entity'
import { UsersRepository } from '../repositories/users.repository'

export type ListUsersInput = PaginationParams

export type ListUsersOutput = Either<never, { users: Paginated<User> }>

/** Admin only: the route is guarded by `@Roles('ADMIN')`. */
@Injectable()
export class ListUsersUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ page, limit }: ListUsersInput): Promise<ListUsersOutput> {
    return right({ users: await this.usersRepository.findMany({ page, limit }) })
  }
}
