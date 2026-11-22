import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import type { User } from '../../enterprise/entities/user.entity'
import { SIGN_IN_HISTORY_MS, signInLockedUntil } from '../../enterprise/policies/sign-in-lock.policy'
import { Email } from '../../enterprise/value-objects/email'
import { InvalidCredentialsError } from '../../errors/invalid-credentials.error'
import { TooManyAttemptsError } from '../../errors/too-many-attempts.error'
import { HashComparer } from '../cryptography/hash-comparer'
import { HashGenerator } from '../cryptography/hash-generator'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'
import { SignInAttemptsRepository } from '../repositories/sign-in-attempts.repository'
import { UsersRepository } from '../repositories/users.repository'
import { SessionIssuer, type SessionTokens } from '../services/session-issuer'

export type AuthenticateUserInput = {
  email: string
  password: string
  /** Shown in the list of sessions. */
  userAgent?: string | null
}

export type AuthenticateUserOutput = Either<
  InvalidCredentialsError | TooManyAttemptsError,
  { user: User; tokens: SessionTokens }
>

/**
 * Sign-in: checks the password and starts a session (rule 1.3), within the limit of attempts (rule 1.4).
 *
 * An e-mail without an account goes through exactly the same steps as a wrong password: same error, a password
 * comparison of the same cost, and the same limit of attempts. Nothing tells the two apart.
 */
@Injectable()
export class AuthenticateUserUseCase {
  private decoyHash?: Promise<string>

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly signInAttemptsRepository: SignInAttemptsRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly sessionIssuer: SessionIssuer,
    private readonly clock: Clock,
  ) {}

  async execute({ email, password, userAgent }: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
    const emailOrError = Email.create(email)
    if (emailOrError.isLeft()) return left(new InvalidCredentialsError())

    const address = emailOrError.value.value
    const now = this.clock.now()
    const historyStart = new Date(now.getTime() - SIGN_IN_HISTORY_MS)

    const failures = await this.signInAttemptsRepository.findFailuresSince(address, historyStart)
    const lockedUntil = signInLockedUntil(failures, now)
    if (lockedUntil) {
      return left(new TooManyAttemptsError(Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000)))
    }

    const user = await this.usersRepository.findByEmail(emailOrError.value)
    const passwordMatches = await this.hashComparer.compare(password, user?.passwordHash ?? (await this.decoy()))

    if (!user || !passwordMatches) {
      await this.signInAttemptsRepository.deleteOlderThan(address, historyStart)
      await this.signInAttemptsRepository.recordFailure(address, now)

      return left(new InvalidCredentialsError())
    }

    await this.signInAttemptsRepository.clear(address)
    await this.refreshTokensRepository.deleteExpiredOfUser(user.id.toString(), now)

    const tokens = await this.sessionIssuer.issue(user, { now, userAgent })

    return right({ user, tokens })
  }

  /**
   * A real hash, computed once, that an unknown e-mail is compared against. Whatever the comparison says, there is
   * no account, so the answer is still "invalid credentials".
   */
  private decoy(): Promise<string> {
    this.decoyHash ??= this.hashGenerator.hash('no account uses this password')

    return this.decoyHash
  }
}
