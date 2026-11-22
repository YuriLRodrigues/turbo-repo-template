import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { tokenIn } from '@test/mail/fake-mailer'
import { HOUR, MINUTE } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import type { User } from '../../enterprise/entities/user.entity'
import { PasswordResetTokenExpiredError } from '../../errors/password-reset-token-expired.error'
import { PasswordResetTokenInvalidError } from '../../errors/password-reset-token-invalid.error'
import { WeakPasswordError } from '../../errors/weak-password.error'
import { ResetPasswordUseCase } from './reset-password.use-case'

describe('ResetPasswordUseCase (rule 1.5)', () => {
  let world: IdentityWorld
  let sut: ResetPasswordUseCase
  let user: User
  let token: string

  beforeEach(async () => {
    world = makeIdentityWorld()
    sut = new ResetPasswordUseCase(
      world.userTokensRepository,
      world.usersRepository,
      world.refreshTokensRepository,
      world.signInAttemptsRepository,
      world.opaqueTokens,
      world.hasher,
      world.unitOfWork,
      world.clock,
    )

    user = makeUser()
    world.usersRepository.items.push(user)
    await world.accountLinkSender.send(user, 'password_reset', world.clock.now())
    token = tokenIn(world.mailer.last)
  })

  it('changes the password', async () => {
    world.clock.advance(5 * MINUTE)

    const result = await sut.execute({ token, password: 'a-new-password' })

    expect(result.isRight()).toBe(true)
    expect(user.passwordHash).toBe('hashed:a-new-password')
    expect(world.unitOfWork.runs).toBe(1)
  })

  it('ends every session of the person', async () => {
    await world.sessionIssuer.issue(user, { now: world.clock.now() })
    await world.sessionIssuer.issue(user, { now: world.clock.now() })
    const someoneElse = await world.sessionIssuer.issue(makeUser(), { now: world.clock.now() })

    await sut.execute({ token, password: 'a-new-password' })

    const own = world.refreshTokensRepository.items.filter((item) => item.userId.equals(user.id))
    expect(own).toHaveLength(2)
    expect(own.every((item) => item.isRevoked)).toBe(true)
    expect(world.refreshTokensRepository.byHash(world.opaqueTokens.hash(someoneElse.refreshToken))?.isRevoked).toBe(
      false,
    )
  })

  it('starts the count of wrong passwords again', async () => {
    await world.signInAttemptsRepository.recordFailure(user.email.value, world.clock.now())

    await sut.execute({ token, password: 'a-new-password' })

    expect(world.signInAttemptsRepository.failures).toHaveLength(0)
  })

  it('works only once', async () => {
    await sut.execute({ token, password: 'a-new-password' })

    const again = await sut.execute({ token, password: 'another-password' })

    expect(again.value).toBeInstanceOf(PasswordResetTokenInvalidError)
    expect(user.passwordHash).toBe('hashed:a-new-password')
  })

  it('refuses an unknown token', async () => {
    const result = await sut.execute({ token: 'never-issued', password: 'a-new-password' })

    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError)
    expect(user.passwordHash).toBe('hashed:secret123')
  })

  it('refuses the link after 1 hour', async () => {
    world.clock.advance(HOUR)

    const result = await sut.execute({ token, password: 'a-new-password' })

    expect(result.value).toBeInstanceOf(PasswordResetTokenExpiredError)
    expect(user.passwordHash).toBe('hashed:secret123')
  })

  it('refuses a confirmation link used as a password link', async () => {
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())

    const result = await sut.execute({ token: tokenIn(world.mailer.last), password: 'a-new-password' })

    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError)
  })

  it('refuses the link of an account that no longer exists', async () => {
    world.usersRepository.items = []

    const result = await sut.execute({ token, password: 'a-new-password' })

    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError)
  })

  it('refuses a short password without spending the link (rule 1.1)', async () => {
    const short = await sut.execute({ token, password: '1234567' })
    expect(short.value).toBeInstanceOf(WeakPasswordError)
    expect(user.passwordHash).toBe('hashed:secret123')

    const retry = await sut.execute({ token, password: 'long-enough' })
    expect(retry.isRight()).toBe(true)
  })
})
