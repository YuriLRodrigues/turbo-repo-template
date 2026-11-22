import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { DAY, MINUTE, TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { RefreshToken } from '../../enterprise/entities/refresh-token.entity'
import { Email } from '../../enterprise/value-objects/email'
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error'
import { TooManyAttemptsError } from '../../errors/too-many-attempts.error'
import { AuthenticateUserUseCase } from './authenticate-user.use-case'

describe('AuthenticateUserUseCase', () => {
  let world: IdentityWorld
  let sut: AuthenticateUserUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new AuthenticateUserUseCase(
      world.usersRepository,
      world.signInAttemptsRepository,
      world.refreshTokensRepository,
      world.hasher,
      world.hasher,
      world.sessionIssuer,
      world.clock,
    )
  })

  const wrongPassword = (email = 'jane@example.com') => sut.execute({ email, password: 'wrong-password' })

  describe('the session (rule 1.3)', () => {
    it('returns an access token carrying the user id, the role and the session', async () => {
      const user = makeUser({ email: Email.restore('jane@example.com'), role: 'ADMIN' })
      world.usersRepository.items.push(user)

      const result = await sut.execute({ email: ' JANE@example.com', password: 'secret123' })

      expect(result.isRight()).toBe(true)
      if (result.isLeft()) return
      const { tokens } = result.value
      expect(JSON.parse(tokens.accessToken)).toEqual({ sub: user.id.toString(), role: 'ADMIN', sid: tokens.sessionId })
      expect(result.value.user).toBe(user)
    })

    it('returns a refresh token valid for 30 days and stores only its hash', async () => {
      world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123', userAgent: 'Firefox' })

      if (result.isLeft()) throw result.value
      const { tokens } = result.value
      const [stored] = world.refreshTokensRepository.items

      expect(world.refreshTokensRepository.items).toHaveLength(1)
      expect(stored.tokenHash).toBe(world.opaqueTokens.hash(tokens.refreshToken))
      expect(stored.tokenHash).not.toBe(tokens.refreshToken)
      expect(stored.familyId.toString()).toBe(tokens.sessionId)
      expect(stored.userAgent).toBe('Firefox')
      expect(tokens.refreshTokenExpiresAt.getTime() - TEST_NOW.getTime()).toBe(30 * DAY)
    })

    it('starts a new session on every sign-in', async () => {
      world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

      const first = await sut.execute({ email: 'jane@example.com', password: 'secret123' })
      const second = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      if (first.isLeft() || second.isLeft()) throw new Error('sign-in failed')
      expect(first.value.tokens.sessionId).not.toBe(second.value.tokens.sessionId)
    })

    it('drops the refresh tokens of the person that have already expired', async () => {
      const user = makeUser({ email: Email.restore('jane@example.com') })
      world.usersRepository.items.push(user)
      world.refreshTokensRepository.items.push(
        RefreshToken.issue({ userId: user.id, tokenHash: 'old', now: new Date(TEST_NOW.getTime() - 31 * DAY) }),
      )

      await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(world.refreshTokensRepository.items.map((token) => token.tokenHash)).not.toContain('old')
    })
  })

  describe('wrong credentials (rule 1.4)', () => {
    it('rejects a wrong password', async () => {
      world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

      const result = await wrongPassword()

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
      expect(world.refreshTokensRepository.items).toHaveLength(0)
    })

    it('rejects an unknown e-mail with the same error', async () => {
      const result = await sut.execute({ email: 'nobody@example.com', password: 'secret123' })

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    })

    it('rejects a malformed e-mail with the same error', async () => {
      const result = await sut.execute({ email: 'not-an-email', password: 'secret123' })

      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    })

    it('answers the same for a wrong password and for an e-mail without an account', async () => {
      world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

      const known = await wrongPassword('jane@example.com')
      const unknown = await wrongPassword('nobody@example.com')

      expect(known.value).toBeInstanceOf(InvalidCredentialsError)
      expect(unknown.value).toBeInstanceOf(InvalidCredentialsError)
      expect((known.value as InvalidCredentialsError).message).toBe((unknown.value as InvalidCredentialsError).message)
      // Both were counted: the limit must not tell them apart either.
      expect(world.signInAttemptsRepository.failures.map((failure) => failure.email)).toEqual([
        'jane@example.com',
        'nobody@example.com',
      ])
    })
  })

  describe('the limit of attempts (rule 1.4)', () => {
    beforeEach(() => {
      world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))
    })

    const failTimes = async (times: number, email?: string) => {
      for (let attempt = 0; attempt < times; attempt++) {
        await wrongPassword(email)
        world.clock.advance(MINUTE)
      }
    }

    it('blocks the sixth attempt after five wrong passwords in 15 minutes, even with the right password', async () => {
      await failTimes(5)

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(result.value).toBeInstanceOf(TooManyAttemptsError)
      expect((result.value as TooManyAttemptsError).httpStatus).toBe(429)
      // The fifth failure was at minute 4; it is minute 5 now: 14 minutes left.
      expect((result.value as TooManyAttemptsError).details).toEqual({ retryAfterSeconds: 14 * 60 })
    })

    it('still answers "wrong credentials" on the fifth wrong password itself', async () => {
      await failTimes(4)

      expect((await wrongPassword()).value).toBeInstanceOf(InvalidCredentialsError)
    })

    it('blocks an e-mail without an account in exactly the same way', async () => {
      await failTimes(5, 'nobody@example.com')

      const result = await sut.execute({ email: 'nobody@example.com', password: 'secret123' })

      expect(result.value).toBeInstanceOf(TooManyAttemptsError)
    })

    it('does not count the attempts made while blocked', async () => {
      await failTimes(5)
      await failTimes(3)

      expect(world.signInAttemptsRepository.failures).toHaveLength(5)
    })

    it('lets the person in again 15 minutes after the fifth wrong password', async () => {
      await failTimes(5)
      world.clock.set(new Date(TEST_NOW.getTime() + 4 * MINUTE + 15 * MINUTE))

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(result.isRight()).toBe(true)
    })

    it('counts each e-mail on its own', async () => {
      await failTimes(5, 'nobody@example.com')

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(result.isRight()).toBe(true)
    })

    it('starts the count again after a successful sign-in', async () => {
      await failTimes(4)
      await sut.execute({ email: 'jane@example.com', password: 'secret123' })
      await failTimes(4)

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(result.isRight()).toBe(true)
      expect(world.signInAttemptsRepository.failures).toHaveLength(0)
    })

    it('does not block when the wrong passwords are spread over more than 15 minutes', async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        await wrongPassword()
        world.clock.advance(4 * MINUTE)
      }

      const result = await sut.execute({ email: 'jane@example.com', password: 'secret123' })

      expect(result.isRight()).toBe(true)
    })
  })
})
