import { Injectable } from '@nestjs/common'

import { type Either, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import { EMAIL_RESEND_INTERVAL_MS } from '../../enterprise/identity-rules'
import { Email } from '../../enterprise/value-objects/email'
import { UserTokensRepository } from '../repositories/user-tokens.repository'
import { UsersRepository } from '../repositories/users.repository'
import { AccountLinkSender } from '../services/account-link-sender'

export type RequestPasswordResetInput = {
  email: string
}

export type RequestPasswordResetOutput = Either<never, Record<string, never>>

/**
 * Rule 1.5: "if the e-mail exists, we sent the link". The answer is the same for an address with an account, one
 * without, and a malformed one, so nobody learns who is registered.
 *
 * An address that asked less than a minute ago gets no second e-mail (the same pace as rule 1.2), so the route
 * cannot be used to flood someone's inbox. The answer does not change.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userTokensRepository: UserTokensRepository,
    private readonly accountLinkSender: AccountLinkSender,
    private readonly clock: Clock,
  ) {}

  async execute({ email }: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    const emailOrError = Email.create(email)
    if (emailOrError.isLeft()) return right({})

    const user = await this.usersRepository.findByEmail(emailOrError.value)
    if (!user) return right({})

    const now = this.clock.now()
    const latest = await this.userTokensRepository.findLatest(user.id.toString(), 'password_reset')
    if (latest && now.getTime() - latest.createdAt.getTime() < EMAIL_RESEND_INTERVAL_MS) return right({})

    await this.accountLinkSender.send(user, 'password_reset', now)

    return right({})
  }
}
