import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { tokenIn } from '@test/mail/fake-mailer'
import { HOUR, MINUTE } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import type { User } from '../../enterprise/entities/user.entity'
import { VerificationTokenExpiredError } from '../../errors/verification-token-expired.error'
import { VerificationTokenInvalidError } from '../../errors/verification-token-invalid.error'
import { VerifyEmailUseCase } from './verify-email.use-case'

describe('VerifyEmailUseCase (rule 1.2)', () => {
  let world: IdentityWorld
  let sut: VerifyEmailUseCase
  let user: User
  let token: string

  beforeEach(async () => {
    world = makeIdentityWorld()
    sut = new VerifyEmailUseCase(
      world.userTokensRepository,
      world.usersRepository,
      world.opaqueTokens,
      world.unitOfWork,
      world.clock,
    )

    user = makeUser()
    world.usersRepository.items.push(user)
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())
    token = tokenIn(world.mailer.last)
  })

  it('confirms the e-mail', async () => {
    world.clock.advance(10 * MINUTE)

    const result = await sut.execute({ token })

    expect(result.isRight()).toBe(true)
    expect(user.isEmailVerified).toBe(true)
    expect(user.emailVerifiedAt).toEqual(world.clock.now())
    expect(world.unitOfWork.runs).toBe(1)
  })

  it('works only once', async () => {
    await sut.execute({ token })

    const again = await sut.execute({ token })

    expect(again.value).toBeInstanceOf(VerificationTokenInvalidError)
  })

  it('refuses an unknown token', async () => {
    const result = await sut.execute({ token: 'never-issued' })

    expect(result.value).toBeInstanceOf(VerificationTokenInvalidError)
    expect(user.isEmailVerified).toBe(false)
  })

  it('refuses the link after 24 hours', async () => {
    world.clock.advance(24 * HOUR)

    const result = await sut.execute({ token })

    expect(result.value).toBeInstanceOf(VerificationTokenExpiredError)
    expect(user.isEmailVerified).toBe(false)
  })

  it('still accepts the link one second before the 24 hours are over', async () => {
    world.clock.advance(24 * HOUR - 1000)

    expect((await sut.execute({ token })).isRight()).toBe(true)
  })

  it('refuses an older link once a newer one was sent', async () => {
    world.clock.advance(2 * MINUTE)
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())

    expect((await sut.execute({ token })).value).toBeInstanceOf(VerificationTokenInvalidError)
    expect((await sut.execute({ token: tokenIn(world.mailer.last) })).isRight()).toBe(true)
  })

  it('refuses a password link used as a confirmation link', async () => {
    await world.accountLinkSender.send(user, 'password_reset', world.clock.now())

    const result = await sut.execute({ token: tokenIn(world.mailer.last) })

    expect(result.value).toBeInstanceOf(VerificationTokenInvalidError)
  })

  it('refuses the link of an account that no longer exists', async () => {
    world.usersRepository.items = []

    expect((await sut.execute({ token })).value).toBeInstanceOf(VerificationTokenInvalidError)
  })
})
