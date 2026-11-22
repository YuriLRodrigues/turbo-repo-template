import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { UnitOfWork } from '@core/persistence/unit-of-work'

import { UserNotFoundError } from '../../errors/user-not-found.error'
import { WrongPasswordError } from '../../errors/wrong-password.error'
import { UserDataContributors } from '../account-data/user-data-contributor'
import { HashComparer } from '../cryptography/hash-comparer'
import { UsersRepository } from '../repositories/users.repository'

export type DeleteUserAccountInput = {
  actor: Actor
  /** Asked again: this cannot be undone, and an open session alone should not be enough. */
  password: string
}

export type DeleteUserAccountOutput = Either<UserNotFoundError | WrongPasswordError, Record<string, never>>

/**
 * Rule 1.6: deleting the account deletes everything that belongs to the person. Each bounded context erases its
 * own data (dependents first), then the user goes; all of it in one unit of work, so a failure leaves the account
 * whole.
 */
@Injectable()
export class DeleteUserAccountUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashComparer: HashComparer,
    private readonly contributors: UserDataContributors,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute({ actor, password }: DeleteUserAccountInput): Promise<DeleteUserAccountOutput> {
    const user = await this.usersRepository.findById(actor.id)
    if (!user) return left(new UserNotFoundError())

    if (!(await this.hashComparer.compare(password, user.passwordHash))) {
      return left(new WrongPasswordError())
    }

    await this.unitOfWork.run(async () => {
      for (const contributor of this.contributors.inEraseOrder) {
        await contributor.erase(actor.id)
      }
      await this.usersRepository.delete(user)
    })

    return right({})
  }
}
