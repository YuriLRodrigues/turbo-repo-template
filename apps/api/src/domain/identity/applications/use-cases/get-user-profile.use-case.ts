import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'

import type { User } from '../../enterprise/entities/user.entity'
import { UserNotFoundError } from '../../errors/user-not-found.error'
import { UsersRepository } from '../repositories/users.repository'

export type GetUserProfileInput = {
  userId: string
}

export type GetUserProfileOutput = Either<UserNotFoundError, { user: User }>

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ userId }: GetUserProfileInput): Promise<GetUserProfileOutput> {
    const user = await this.usersRepository.findById(userId)
    if (!user) return left(new UserNotFoundError())

    return right({ user })
  }
}
