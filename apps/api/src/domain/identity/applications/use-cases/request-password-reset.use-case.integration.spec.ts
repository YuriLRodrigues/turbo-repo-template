import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { tokenIn } from '@test/mail/fake-mailer'
import { HOUR, SECOND, TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { Email } from '../../enterprise/value-objects/email'
import { RequestPasswordResetUseCase } from './request-password-reset.use-case'

describe('RequestPasswordResetUseCase (rule 1.5)', () => {
  let world: IdentityWorld
  let sut: RequestPasswordResetUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new RequestPasswordResetUseCase(
      world.usersRepository,
      world.userTokensRepository,
      world.accountLinkSender,
      world.clock,
    )
    world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))
  })

  it('sends a single-use link valid for 1 hour and keeps only its hash', async () => {
    const result = await sut.execute({ email: ' Jane@Example.com ' })

    expect(result.isRight()).toBe(true)
    expect(world.mailer.last).toMatchObject({ to: 'jane@example.com', subject: 'Choose a new password for Example' })

    const [stored] = world.userTokensRepository.items
    expect(stored.kind).toBe('password_reset')
    expect(stored.tokenHash).toBe(world.opaqueTokens.hash(tokenIn(world.mailer.last)))
    expect(stored.expiresAt.getTime() - TEST_NOW.getTime()).toBe(HOUR)
  })

  it('answers the same, and sends nothing, for an e-mail without an account', async () => {
    const result = await sut.execute({ email: 'nobody@example.com' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({})
    expect(world.mailer.sent).toHaveLength(0)
    expect(world.userTokensRepository.items).toHaveLength(0)
  })

  it('answers the same for a malformed e-mail', async () => {
    const result = await sut.execute({ email: 'not-an-email' })

    expect(result.isRight()).toBe(true)
    expect(world.mailer.sent).toHaveLength(0)
  })

  it('does not send a second e-mail within the same minute, and still answers the same', async () => {
    await sut.execute({ email: 'jane@example.com' })
    world.clock.advance(30 * SECOND)

    const result = await sut.execute({ email: 'jane@example.com' })

    expect(result.isRight()).toBe(true)
    expect(world.mailer.sent).toHaveLength(1)
  })

  it('sends a new link after a minute, and the older link stops working', async () => {
    await sut.execute({ email: 'jane@example.com' })
    world.clock.advance(60 * SECOND)

    await sut.execute({ email: 'jane@example.com' })

    expect(world.mailer.sent).toHaveLength(2)
    const [older, newer] = world.userTokensRepository.items
    expect(older.isUsed).toBe(true)
    expect(newer.isUsed).toBe(false)
  })
})
