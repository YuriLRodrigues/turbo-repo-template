import { beforeEach, describe, expect, it } from 'vitest'

import { actorOf, makeUser } from '@test/factories/make-user'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { SessionNotFoundError } from '../../errors/session-not-found.error'
import { RevokeSessionUseCase } from './revoke-session.use-case'

describe('RevokeSessionUseCase (rule 1.3)', () => {
  let world: IdentityWorld
  let sut: RevokeSessionUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new RevokeSessionUseCase(world.refreshTokensRepository, world.clock)
  })

  const revoked = (token: string) => world.refreshTokensRepository.byHash(world.opaqueTokens.hash(token))?.isRevoked

  it('ends that session and leaves the others open', async () => {
    const user = makeUser()
    const phone = await world.sessionIssuer.issue(user, { now: world.clock.now() })
    const laptop = await world.sessionIssuer.issue(user, { now: world.clock.now() })

    const result = await sut.execute({ actor: actorOf(user), sessionId: phone.sessionId })

    expect(result.isRight()).toBe(true)
    expect(revoked(phone.refreshToken)).toBe(true)
    expect(revoked(laptop.refreshToken)).toBe(false)
  })

  it("answers 404 for someone else's session and does not touch it (rule 0.4)", async () => {
    const victim = await world.sessionIssuer.issue(makeUser(), { now: world.clock.now() })

    const result = await sut.execute({ actor: actorOf(makeUser()), sessionId: victim.sessionId })

    expect(result.value).toBeInstanceOf(SessionNotFoundError)
    expect((result.value as SessionNotFoundError).httpStatus).toBe(404)
    expect(revoked(victim.refreshToken)).toBe(false)
  })

  it('answers 404 for a session that does not exist or already ended', async () => {
    const user = makeUser()
    const session = await world.sessionIssuer.issue(user, { now: world.clock.now() })
    await sut.execute({ actor: actorOf(user), sessionId: session.sessionId })

    const again = await sut.execute({ actor: actorOf(user), sessionId: session.sessionId })
    const unknown = await sut.execute({ actor: actorOf(user), sessionId: 'f3b0c0a4-6a0e-4a55-9d0f-4b1f4a2d7c11' })

    expect(again.value).toBeInstanceOf(SessionNotFoundError)
    expect(unknown.value).toBeInstanceOf(SessionNotFoundError)
  })
})
