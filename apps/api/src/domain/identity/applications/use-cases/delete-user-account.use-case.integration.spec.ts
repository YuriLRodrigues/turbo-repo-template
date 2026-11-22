import { beforeEach, describe, expect, it } from 'vitest'

import { FakeUserDataContributor } from '@test/account-data/fake-user-data-contributor'
import { actorOf, makeActor, makeUser } from '@test/factories/make-user'
import { TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { Preferences } from '../../enterprise/entities/preferences.entity'
import { UserNotFoundError } from '../../errors/user-not-found.error'
import { WrongPasswordError } from '../../errors/wrong-password.error'
import { UserDataContributors } from '../account-data/user-data-contributor'
import { DeleteUserAccountUseCase } from './delete-user-account.use-case'

describe('DeleteUserAccountUseCase (rule 1.6)', () => {
  let world: IdentityWorld
  let calls: string[]
  let notes: FakeUserDataContributor
  let files: FakeUserDataContributor
  let sut: DeleteUserAccountUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    calls = []
    notes = new FakeUserDataContributor('notes', calls)
    files = new FakeUserDataContributor('files', calls)
    sut = new DeleteUserAccountUseCase(
      world.usersRepository,
      world.hasher,
      new UserDataContributors([world.identityUserData, notes, files]),
      world.unitOfWork,
    )
  })

  it('deletes the user and everything every bounded context keeps for them', async () => {
    const user = makeUser()
    const userId = user.id.toString()
    world.usersRepository.items.push(user)
    notes.rows.set(userId, ['First note'])
    files.rows.set(userId, ['report.pdf'])
    world.preferencesRepository.items.push(Preferences.defaultsFor(user.id))
    await world.sessionIssuer.issue(user, { now: world.clock.now() })
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())
    await world.signInAttemptsRepository.recordFailure(user.email.value, TEST_NOW)

    const result = await sut.execute({ actor: actorOf(user), password: 'secret123' })

    expect(result.isRight()).toBe(true)
    expect(world.usersRepository.items).toHaveLength(0)
    expect(notes.rows.has(userId)).toBe(false)
    expect(files.rows.has(userId)).toBe(false)
    expect(world.preferencesRepository.items).toHaveLength(0)
    expect(world.refreshTokensRepository.items).toHaveLength(0)
    expect(world.userTokensRepository.items).toHaveLength(0)
    expect(world.signInAttemptsRepository.failures).toHaveLength(0)
  })

  it('erases dependents first, in one unit of work', async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)

    await sut.execute({ actor: actorOf(user), password: 'secret123' })

    // Registered as identity, notes, files: erased backwards (identity erases silently, it is the real one).
    expect(calls).toEqual(['erase:files', 'erase:notes'])
    expect(world.unitOfWork.runs).toBe(1)
  })

  it("leaves everyone else's data alone", async () => {
    const jane = makeUser()
    const john = makeUser()
    world.usersRepository.items.push(jane, john)
    notes.rows.set(john.id.toString(), ["John's note"])
    const johnSession = await world.sessionIssuer.issue(john, { now: world.clock.now() })

    await sut.execute({ actor: actorOf(jane), password: 'secret123' })

    expect(world.usersRepository.items).toEqual([john])
    expect(notes.rows.get(john.id.toString())).toEqual(["John's note"])
    expect(world.refreshTokensRepository.byHash(world.opaqueTokens.hash(johnSession.refreshToken))).toBeDefined()
  })

  it('asks for the password again and deletes nothing when it is wrong', async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)
    notes.rows.set(user.id.toString(), ['First note'])

    const result = await sut.execute({ actor: actorOf(user), password: 'wrong-password' })

    expect(result.value).toBeInstanceOf(WrongPasswordError)
    expect(world.usersRepository.items).toHaveLength(1)
    expect(notes.rows.get(user.id.toString())).toEqual(['First note'])
    expect(calls).toEqual([])
  })

  it('fails when the account no longer exists', async () => {
    const result = await sut.execute({ actor: makeActor(), password: 'secret123' })

    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
