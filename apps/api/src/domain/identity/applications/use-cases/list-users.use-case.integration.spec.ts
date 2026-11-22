import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { InMemoryUsersRepository } from '@test/repositories/in-memory-users.repository'

import { ListUsersUseCase } from './list-users.use-case'

describe('ListUsersUseCase', () => {
  let usersRepository: InMemoryUsersRepository
  let sut: ListUsersUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ListUsersUseCase(usersRepository)
  })

  it('lists users newest first, one page at a time', async () => {
    for (let day = 1; day <= 3; day++) {
      usersRepository.items.push(makeUser({ name: `User ${day}`, createdAt: new Date(2026, 0, day) }))
    }

    const result = await sut.execute({ page: 1, limit: 2 })

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) return
    expect(result.value.users.results.map((user) => user.name)).toEqual(['User 3', 'User 2'])
    expect(result.value.users.meta).toEqual({ page: 1, limit: 2, totalItems: 3, totalPages: 2 })
  })
})
