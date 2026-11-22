import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'
import { UnitOfWork } from '@core/persistence/unit-of-work'
import { Clock } from '@core/time/clock'

import { PASSWORD_MIN_LENGTH } from '../../enterprise/identity-rules'
import { isAcceptablePassword } from '../../enterprise/policies/password.policy'
import { PasswordResetTokenExpiredError } from '../../errors/password-reset-token-expired.error'
import { PasswordResetTokenInvalidError } from '../../errors/password-reset-token-invalid.error'
import { WeakPasswordError } from '../../errors/weak-password.error'
import { HashGenerator } from '../cryptography/hash-generator'
import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository'
import { SignInAttemptsRepository } from '../repositories/sign-in-attempts.repository'
import { UserTokensRepository } from '../repositories/user-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'

export type ResetPasswordInput = {
  /** The token of the link that was sent by e-mail. */
  token: string
  password: string
}

export type ResetPasswordOutput = Either<
  PasswordResetTokenInvalidError | PasswordResetTokenExpiredError | WeakPasswordError,
  Record<string, never>
>

/**
 * Rule 1.5: the link works once and for 1 hour. Changing the password ends every session, so whoever was signed in
 * with the old one is out. The count of wrong passwords starts again: the person just proved the mailbox is theirs.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userTokensRepository: UserTokensRepository,
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly signInAttemptsRepository: SignInAttemptsRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly hashGenerator: HashGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ token, password }: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const now = this.clock.now()
    const userToken = await this.userTokensRepository.findByHash('password_reset', this.opaqueTokens.hash(token))
    if (!userToken || userToken.isUsed) return left(new PasswordResetTokenInvalidError())
    if (userToken.isExpired(now)) return left(new PasswordResetTokenExpiredError())

    const user = await this.usersRepository.findById(userToken.userId.toString())
    if (!user) return left(new PasswordResetTokenInvalidError())

    // Checked after the link, and before it is spent: a short password can be corrected and sent again.
    if (!isAcceptablePassword(password)) return left(new WeakPasswordError(PASSWORD_MIN_LENGTH))

    user.changePassword(await this.hashGenerator.hash(password))
    userToken.use(now)

    await this.unitOfWork.run(async () => {
      await this.usersRepository.save(user)
      await this.userTokensRepository.save(userToken)
      await this.refreshTokensRepository.revokeAllOfUser(user.id.toString(), now)
      await this.signInAttemptsRepository.clear(user.email.value)
    })

    return right({})
  }
}
