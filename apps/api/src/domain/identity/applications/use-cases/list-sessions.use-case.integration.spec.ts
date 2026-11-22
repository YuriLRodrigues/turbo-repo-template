import { beforeEach, describe, expect, it } from 'vitest'

import { actorOf, makeUser } from '@test/factories/make-user'
import { DAY, HOUR, TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { ListSessionsUseCase } from './list-sessions.use-case'

describe('ListSessionsUseCase (rule 1.3)', () => {
  let world: IdentityWorld
  let sut: ListSessionsUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new ListSessionsUseCase(world.refreshTokensRepository, world.clock)
  })

  it('lists the open sessions of the person, most recently used first', async () => {
    const user = makeUser()
    const phone = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Phone' })
    world.clock.advance(HOUR)
    const laptop = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Laptop' })
    await world.sessionIssuer.issue(makeUser(), { now: world.clock.now(), userAgent: 'Someone else' })

    const result = await sut.execute({ actor: actorOf(user), page: 1, limit: 20 })

    expect(result.value.sessions.results.map((session) => session.userAgent)).toEqual(['Laptop', 'Phone'])
    expect(result.value.sessions.results.map((session) => session.id)).toEqual([laptop.sessionId, phone.sessionId])
    expect(result.value.sessions.meta).toEqual({ page: 1, limit: 20, totalItems: 2, totalPages: 1 })
  })

  it('shows one session per sign-in, with when it started and when it was last renewed', async () => {
    const user = makeUser()
    const session = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Phone' })
    const [first] = world.refreshTokensRepository.items
    world.clock.advance(2 * DAY)
    await world.refreshTokensRepository.markRotated(first.id.toString(), world.clock.now())
    await world.sessionIssuer.issue(user, { now: world.clock.now(), familyId: first.familyId, userAgent: 'Phone' })

    const result = await sut.execute({ actor: actorOf(user), page: 1, limit: 20 })

    expect(result.value.sessions.results).toEqual([
      {
        id: session.sessionId,
        userId: user.id.toString(),
        createdAt: TEST_NOW,
        lastUsedAt: new Date(TEST_NOW.getTime() + 2 * DAY),
        expiresAt: new Date(TEST_NOW.getTime() + 32 * DAY),
        userAgent: 'Phone',
      },
    ])
  })

  it('leaves out the sessions that were revoked or expired', async () => {
    const user = makeUser()
    const revoked = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Revoked' })
    await world.refreshTokensRepository.revokeFamily(revoked.sessionId, world.clock.now())
    await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Expired' })
    world.clock.advance(30 * DAY)
    await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Alive' })

    const result = await sut.execute({ actor: actorOf(user), page: 1, limit: 20 })

    expect(result.value.sessions.results.map((session) => session.userAgent)).toEqual(['Alive'])
  })

  it('paginates', async () => {
    const user = makeUser()
    for (let index = 0; index < 3; index++) {
      await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: `Device ${index}` })
      world.clock.advance(HOUR)
    }

    const result = await sut.execute({ actor: actorOf(user), page: 2, limit: 2 })

    expect(result.value.sessions.results.map((session) => session.userAgent)).toEqual(['Device 0'])
    expect(result.value.sessions.meta).toEqual({ page: 2, limit: 2, totalItems: 3, totalPages: 2 })
  })
})
