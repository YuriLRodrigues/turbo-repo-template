import { beforeEach, describe, expect, it } from 'vitest'

import { makeUser } from '@test/factories/make-user'
import { tokenIn } from '@test/mail/fake-mailer'
import { TEST_NOW } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { Email } from '../../enterprise/value-objects/email'
import { EmailAlreadyInUseError } from '../../errors/email-already-in-use.error'
import { InvalidEmailError } from '../../errors/invalid-email.error'
import { InvalidUserNameError } from '../../errors/invalid-user-name.error'
import { WeakPasswordError } from '../../errors/weak-password.error'
import { RegisterUserUseCase } from './register-user.use-case'

describe('RegisterUserUseCase (rules 1.1 and 1.2)', () => {
  let world: IdentityWorld
  let sut: RegisterUserUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    sut = new RegisterUserUseCase(
      world.usersRepository,
      world.hasher,
      world.accountLinkSender,
      world.mailer,
      world.unitOfWork,
      world.clock,
    )
  })

  it('registers a user with a hashed password, the USER role and an unconfirmed e-mail', async () => {
    const result = await sut.execute({ name: '  Jane   Doe ', email: 'Jane@Example.com', password: 'secret123' })

    expect(result.isRight()).toBe(true)
    expect(world.usersRepository.items).toHaveLength(1)

    const [user] = world.usersRepository.items
    expect(user.name).toBe('Jane Doe')
    expect(user.email.value).toBe('jane@example.com')
    expect(user.passwordHash).toBe('hashed:secret123')
    expect(user.role).toBe('USER')
    expect(user.isEmailVerified).toBe(false)
    expect(user.createdAt).toEqual(TEST_NOW)
  })

  it('sends the confirmation link, valid for 24 hours, and keeps only its hash (rule 1.2)', async () => {
    await sut.execute({ name: 'Jane Doe', email: 'jane@example.com', password: 'secret123' })

    expect(world.mailer.sent).toHaveLength(1)
    expect(world.mailer.last).toMatchObject({ to: 'jane@example.com', subject: 'Confirm your e-mail for Example' })

    const token = tokenIn(world.mailer.last)
    const [stored] = world.userTokensRepository.items
    expect(stored.kind).toBe('email_verification')
    expect(stored.tokenHash).toBe(world.opaqueTokens.hash(token))
    expect(stored.tokenHash).not.toBe(token)
    expect(stored.expiresAt.getTime() - TEST_NOW.getTime()).toBe(24 * 60 * 60 * 1000)
    expect(world.unitOfWork.runs).toBe(1)
  })

  it('rejects an e-mail that is already registered, whatever the case (rule 1.1)', async () => {
    world.usersRepository.items.push(makeUser({ email: Email.restore('jane@example.com') }))

    const result = await sut.execute({ name: 'Jane', email: 'JANE@example.com', password: 'secret123' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailAlreadyInUseError)
    expect(world.usersRepository.items).toHaveLength(1)
    expect(world.mailer.sent).toHaveLength(0)
  })

  it('rejects an invalid e-mail', async () => {
    const result = await sut.execute({ name: 'Jane', email: 'not-an-email', password: 'secret123' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidEmailError)
    expect(world.usersRepository.items).toHaveLength(0)
  })

  it.each(['   ', 'x'.repeat(61)])('rejects the name "%s" (rule 0.8)', async (name) => {
    const result = await sut.execute({ name, email: 'jane@example.com', password: 'secret123' })

    expect(result.value).toBeInstanceOf(InvalidUserNameError)
    expect(world.usersRepository.items).toHaveLength(0)
  })

  it('rejects a password shorter than 8 characters (rule 1.1)', async () => {
    const result = await sut.execute({ name: 'Jane', email: 'jane@example.com', password: '1234567' })

    expect(result.value).toBeInstanceOf(WeakPasswordError)
    expect(world.usersRepository.items).toHaveLength(0)
  })
})
