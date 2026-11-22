import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users.repository'

import { UserNotFoundError } from '../../errors/user-not-found.error'
import { GetUserProfileUseCase } from './get-user-profile.use-case'

describe('GetUserProfileUseCase', () => {
  let usersRepository: InMemoryUsersRepository
  let sut: GetUserProfileUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new GetUserProfileUseCase(usersRepository)
  })

  it('returns the user', async () => {
    const user = makeUser()
    usersRepository.items.push(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ user })
  })

  it('fails when the user no longer exists', async () => {
    const result = await sut.execute({ userId: 'missing-id' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
