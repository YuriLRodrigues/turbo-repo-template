import { beforeEach, describe, expect, it } from 'vitest'

import { actorOf, makeActor, makeUser } from '@test/factories/make-user'
import { SECOND, TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { EmailAlreadyVerifiedError } from '../../errors/email-already-verified.error'
import { UserNotFoundError } from '../../errors/user-not-found.error'
import { VerificationResendTooSoonError } from '../../errors/verification-resend-too-soon.error'
import { ResendEmailVerificationUseCase } from './resend-email-verification.use-case'

describe('ResendEmailVerificationUseCase (rule 1.2)', () => {
  let world: IdentityWorld
  let sut: ResendEmailVerificationUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new ResendEmailVerificationUseCase(
      world.usersRepository,
      world.userTokensRepository,
      world.accountLinkSender,
      world.clock,
    )
  })

  it('sends a new link when none was sent in the last minute', async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())
    world.clock.advance(60 * SECOND)

    const result = await sut.execute({ actor: actorOf(user) })

    expect(result.isRight()).toBe(true)
    expect(world.mailer.sent).toHaveLength(2)
    expect(world.mailer.last?.to).toBe(user.email.value)
  })

  it('sends the first link to someone who has none', async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)

    const result = await sut.execute({ actor: actorOf(user) })

    expect(result.isRight()).toBe(true)
    expect(world.mailer.sent).toHaveLength(1)
  })

  it('refuses a second e-mail within the same minute and says how long to wait', async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)
    await world.accountLinkSender.send(user, 'email_verification', world.clock.now())
    world.clock.advance(20 * SECOND)

    const result = await sut.execute({ actor: actorOf(user) })

    expect(result.value).toBeInstanceOf(VerificationResendTooSoonError)
    expect((result.value as VerificationResendTooSoonError).details).toEqual({ retryAfterSeconds: 40 })
    expect(world.mailer.sent).toHaveLength(1)
  })

  it('refuses when the e-mail is already confirmed', async () => {
    const user = makeUser({ emailVerifiedAt: TEST_NOW })
    world.usersRepository.items.push(user)

    const result = await sut.execute({ actor: actorOf(user) })

    expect(result.value).toBeInstanceOf(EmailAlreadyVerifiedError)
    expect(world.mailer.sent).toHaveLength(0)
  })

  it('fails when the account no longer exists', async () => {
    const result = await sut.execute({ actor: makeActor() })

    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
