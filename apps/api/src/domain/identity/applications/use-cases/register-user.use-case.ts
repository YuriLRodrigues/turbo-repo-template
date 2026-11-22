import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'
import { UnitOfWork } from '@core/persistence/unit-of-work'
import { cleanName, NAME_MAX_LENGTH } from '@core/text/text'
import { Clock } from '@core/time/clock'

import { User } from '../../enterprise/entities/user.entity'
import { PASSWORD_MIN_LENGTH } from '../../enterprise/identity-rules'
import { isAcceptablePassword } from '../../enterprise/policies/password.policy'
import { Email } from '../../enterprise/value-objects/email'
import { EmailAlreadyInUseError } from '../../errors/email-already-in-use.error'
import type { InvalidEmailError } from '../../errors/invalid-email.error'
import { InvalidUserNameError } from '../../errors/invalid-user-name.error'
import { WeakPasswordError } from '../../errors/weak-password.error'
import { HashGenerator } from '../cryptography/hash-generator'
import { Mailer } from '../mail/mailer'
import { UsersRepository } from '../repositories/users.repository'
import { AccountLinkSender } from '../services/account-link-sender'

export type RegisterUserInput = {
  name: string
  email: string
  password: string
}

export type RegisterUserOutput = Either<
  InvalidUserNameError | InvalidEmailError | WeakPasswordError | EmailAlreadyInUseError,
  { user: User }
>

/** Rules 1.1 and 1.2: creates the account and sends the link that confirms the e-mail. */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly accountLinkSender: AccountLinkSender,
    private readonly mailer: Mailer,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ name, email, password }: RegisterUserInput): Promise<RegisterUserOutput> {
    const cleanedName = cleanName(name)
    if (!cleanedName) return left(new InvalidUserNameError(NAME_MAX_LENGTH))

    const emailOrError = Email.create(email)
    if (emailOrError.isLeft()) return left(emailOrError.value)

    if (!isAcceptablePassword(password)) return left(new WeakPasswordError(PASSWORD_MIN_LENGTH))

    if (await this.usersRepository.findByEmail(emailOrError.value)) {
      return left(new EmailAlreadyInUseError())
    }

    const now = this.clock.now()
    const user = User.create({
      name: cleanedName,
      email: emailOrError.value,
      passwordHash: await this.hashGenerator.hash(password),
      createdAt: now,
    })

    // The account and its confirmation link exist together or not at all; the e-mail leaves after the commit.
    const message = await this.unitOfWork.run(async () => {
      await this.usersRepository.create(user)

      return this.accountLinkSender.issue(user, 'email_verification', now)
    })
    await this.mailer.send(message)

    return right({ user })
  }
}
