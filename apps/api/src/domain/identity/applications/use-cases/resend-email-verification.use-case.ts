import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import { EMAIL_RESEND_INTERVAL_MS } from '../../enterprise/identity-rules'
import { EmailAlreadyVerifiedError } from '../../errors/email-already-verified.error'
import { UserNotFoundError } from '../../errors/user-not-found.error'
import { VerificationResendTooSoonError } from '../../errors/verification-resend-too-soon.error'
import { UserTokensRepository } from '../repositories/user-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'
import { AccountLinkSender } from '../services/account-link-sender'

export type ResendEmailVerificationInput = {
  actor: Actor
}

export type ResendEmailVerificationOutput = Either<
  UserNotFoundError | EmailAlreadyVerifiedError | VerificationResendTooSoonError,
  Record<string, never>
>

/** Rule 1.2: the confirmation link can be sent again, once per minute. The new link replaces the previous one. */
@Injectable()
export class ResendEmailVerificationUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userTokensRepository: UserTokensRepository,
    private readonly accountLinkSender: AccountLinkSender,
    private readonly clock: Clock,
  ) {}

  async execute({ actor }: ResendEmailVerificationInput): Promise<ResendEmailVerificationOutput> {
    const user = await this.usersRepository.findById(actor.id)
    if (!user) return left(new UserNotFoundError())
    if (user.isEmailVerified) return left(new EmailAlreadyVerifiedError())

    const now = this.clock.now()
    const latest = await this.userTokensRepository.findLatest(actor.id, 'email_verification')
    const waitMs = latest ? latest.createdAt.getTime() + EMAIL_RESEND_INTERVAL_MS - now.getTime() : 0
    if (waitMs > 0) return left(new VerificationResendTooSoonError(Math.ceil(waitMs / 1000)))

    await this.accountLinkSender.send(user, 'email_verification', now)

    return right({})
  }
}
