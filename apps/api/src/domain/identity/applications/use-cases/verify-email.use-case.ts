import { Injectable } from '@nestjs/common'

import { type Either, left, right } from '@core/logic/either'
import { UnitOfWork } from '@core/persistence/unit-of-work'
import { Clock } from '@core/time/clock'

import type { User } from '../../enterprise/entities/user.entity'
import { VerificationTokenExpiredError } from '../../errors/verification-token-expired.error'
import { VerificationTokenInvalidError } from '../../errors/verification-token-invalid.error'
import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { UserTokensRepository } from '../repositories/user-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'

export type VerifyEmailInput = {
  /** The token of the link that was sent by e-mail. */
  token: string
}

export type VerifyEmailOutput = Either<VerificationTokenInvalidError | VerificationTokenExpiredError, { user: User }>

/** Rule 1.2: opening the link confirms the e-mail. The link works once and for 24 hours. */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly userTokensRepository: UserTokensRepository,
    private readonly usersRepository: UsersRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute({ token }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const now = this.clock.now()
    const userToken = await this.userTokensRepository.findByHash('email_verification', this.opaqueTokens.hash(token))
    if (!userToken || userToken.isUsed) return left(new VerificationTokenInvalidError())
    if (userToken.isExpired(now)) return left(new VerificationTokenExpiredError())

    const user = await this.usersRepository.findById(userToken.userId.toString())
    if (!user) return left(new VerificationTokenInvalidError())

    user.verifyEmail(now)
    userToken.use(now)

    await this.unitOfWork.run(async () => {
      await this.usersRepository.save(user)
      await this.userTokensRepository.save(userToken)
    })

    return right({ user })
  }
}
