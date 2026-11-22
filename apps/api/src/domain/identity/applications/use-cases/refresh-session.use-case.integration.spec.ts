import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { DAY, MINUTE, TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import type { User } from '../../enterprise/entities/user.entity'
import { RefreshTokenExpiredError } from '../../errors/refresh-token-expired.error'
import { RefreshTokenInvalidError } from '../../errors/refresh-token-invalid.error'
import { RefreshTokenReusedError } from '../../errors/refresh-token-reused.error'
import type { SessionTokens } from '../services/session-issuer'
import { RefreshSessionUseCase } from './refresh-session.use-case'

describe('RefreshSessionUseCase (rule 1.3)', () => {
  let world: IdentityWorld
  let sut: RefreshSessionUseCase
  let user: User
  let session: SessionTokens

  beforeEach(async () => {
    world = makeIdentityWorld()
    sut = new RefreshSessionUseCase(
      world.refreshTokensRepository,
      world.usersRepository,
      world.opaqueTokens,
      world.sessionIssuer,
      world.unitOfWork,
      world.clock,
    )

    user = makeUser()
    world.usersRepository.items.push(user)
    session = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Firefox' })
  })

  const stored = (token: string) => world.refreshTokensRepository.byHash(world.opaqueTokens.hash(token))

  it('exchanges the token for a new pair in the same session', async () => {
    world.clock.advance(10 * MINUTE)

    const result = await sut.execute({ refreshToken: session.refreshToken })

    if (result.isLeft()) throw result.value
    const { tokens } = result.value
    expect(tokens.refreshToken).not.toBe(session.refreshToken)
    expect(tokens.sessionId).toBe(session.sessionId)
    expect(JSON.parse(tokens.accessToken)).toEqual({ sub: user.id.toString(), role: 'USER', sid: session.sessionId })
    expect(result.value.user).toBe(user)
  })

  it('marks the old token as exchanged and gives the new one 30 more days', async () => {
    world.clock.advance(2 * DAY)

    const result = await sut.execute({ refreshToken: session.refreshToken })

    if (result.isLeft()) throw result.value
    expect(stored(session.refreshToken)?.rotatedAt).toEqual(world.clock.now())
    expect(stored(result.value.tokens.refreshToken)?.isRotated).toBe(false)
    expect(result.value.tokens.refreshTokenExpiresAt.getTime()).toBe(TEST_NOW.getTime() + 32 * DAY)
    expect(world.unitOfWork.runs).toBe(1)
  })

  it('keeps the user agent of the session when the request brings none', async () => {
    const result = await sut.execute({ refreshToken: session.refreshToken })

    if (result.isLeft()) throw result.value
    expect(stored(result.value.tokens.refreshToken)?.userAgent).toBe('Firefox')
  })

  it('can be chained: each new token works once', async () => {
    const first = await sut.execute({ refreshToken: session.refreshToken })
    if (first.isLeft()) throw first.value
    const second = await sut.execute({ refreshToken: first.value.tokens.refreshToken })

    expect(second.isRight()).toBe(true)
  })

  it('refuses a missing or unknown token', async () => {
    expect((await sut.execute({ refreshToken: undefined })).value).toBeInstanceOf(RefreshTokenInvalidError)
    expect((await sut.execute({ refreshToken: 'never-issued' })).value).toBeInstanceOf(RefreshTokenInvalidError)
  })

  it('refuses a token after 30 days', async () => {
    world.clock.advance(30 * DAY)

    const result = await sut.execute({ refreshToken: session.refreshToken })

    expect(result.value).toBeInstanceOf(RefreshTokenExpiredError)
    expect((result.value as RefreshTokenExpiredError).httpStatus).toBe(401)
  })

  it('refuses a token that was revoked', async () => {
    await world.refreshTokensRepository.revokeFamily(session.sessionId, world.clock.now())

    const result = await sut.execute({ refreshToken: session.refreshToken })

    expect(result.value).toBeInstanceOf(RefreshTokenInvalidError)
  })

  it('refuses the token of an account that no longer exists', async () => {
    world.usersRepository.items = []

    const result = await sut.execute({ refreshToken: session.refreshToken })

    expect(result.value).toBeInstanceOf(RefreshTokenInvalidError)
  })

  describe('reuse detection', () => {
    it('ends the whole session when an exchanged token shows up again', async () => {
      const renewed = await sut.execute({ refreshToken: session.refreshToken })
      if (renewed.isLeft()) throw renewed.value

      const replay = await sut.execute({ refreshToken: session.refreshToken })

      expect(replay.value).toBeInstanceOf(RefreshTokenReusedError)
      expect((replay.value as RefreshTokenReusedError).code).toBe('AUTH.REFRESH_TOKEN_REUSED')
      // The token that was legitimately issued is dead as well: whoever holds it must sign in again.
      const afterwards = await sut.execute({ refreshToken: renewed.value.tokens.refreshToken })
      expect(afterwards.value).toBeInstanceOf(RefreshTokenInvalidError)
      expect(world.refreshTokensRepository.items.every((token) => token.isRevoked)).toBe(true)
    })

    it('leaves the other sessions of the person alone', async () => {
      const other = await world.sessionIssuer.issue(user, { now: world.clock.now() })
      await sut.execute({ refreshToken: session.refreshToken })
      await sut.execute({ refreshToken: session.refreshToken })

      const result = await sut.execute({ refreshToken: other.refreshToken })

      expect(result.isRight()).toBe(true)
    })

    it('treats a lost race for the same token as reuse', async () => {
      // Another request exchanges the token between this one reading it and marking it.
      const markRotated = world.refreshTokensRepository.markRotated.bind(world.refreshTokensRepository)
      world.refreshTokensRepository.markRotated = async (tokenId, at) => {
        await markRotated(tokenId, at)

        return markRotated(tokenId, at)
      }

      const result = await sut.execute({ refreshToken: session.refreshToken })

      expect(result.value).toBeInstanceOf(RefreshTokenReusedError)
      expect(stored(session.refreshToken)?.isRevoked).toBe(true)
    })
  })
})
