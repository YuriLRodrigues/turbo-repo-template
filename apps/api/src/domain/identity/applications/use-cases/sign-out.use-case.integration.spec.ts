import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { SignOutUseCase } from './sign-out.use-case'

describe('SignOutUseCase (rule 1.3)', () => {
  let world: IdentityWorld
  let sut: SignOutUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new SignOutUseCase(world.refreshTokensRepository, world.opaqueTokens, world.clock)
  })

  it('revokes the family of the token, and only that family', async () => {
    const user = makeUser()
    const session = await world.sessionIssuer.issue(user, { now: world.clock.now() })
    const renewed = await world.sessionIssuer.issue(user, {
      now: world.clock.now(),
      familyId: world.refreshTokensRepository.items[0].familyId,
    })
    const other = await world.sessionIssuer.issue(user, { now: world.clock.now() })

    const result = await sut.execute({ refreshToken: renewed.refreshToken })

    expect(result.isRight()).toBe(true)
    const revoked = (token: string) => world.refreshTokensRepository.byHash(world.opaqueTokens.hash(token))?.isRevoked
    expect(revoked(session.refreshToken)).toBe(true)
    expect(revoked(renewed.refreshToken)).toBe(true)
    expect(revoked(other.refreshToken)).toBe(false)
  })

  it('is idempotent: signing out twice is fine', async () => {
    const session = await world.sessionIssuer.issue(makeUser(), { now: world.clock.now() })

    await sut.execute({ refreshToken: session.refreshToken })
    const again = await sut.execute({ refreshToken: session.refreshToken })

    expect(again.isRight()).toBe(true)
  })

  it('answers the same without a token or with an unknown one', async () => {
    expect((await sut.execute({ refreshToken: undefined })).isRight()).toBe(true)
    expect((await sut.execute({ refreshToken: 'never-issued' })).isRight()).toBe(true)
  })
})
