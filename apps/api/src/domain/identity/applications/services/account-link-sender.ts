import { Injectable } from '@nestjs/common'

import type { User } from '../../enterprise/entities/user.entity'
import { UserToken } from '../../enterprise/entities/user-token.entity'
import type { UserTokenKind } from '../../enterprise/user-token-kind'
import { OpaqueTokens } from '../cryptography/opaque-tokens'
import { AccountLinks } from '../mail/account-links'
import { Mailer, type MailMessage } from '../mail/mailer'
import { emailVerificationMessage, passwordResetMessage } from '../mail/messages'
import { UserTokensRepository } from '../repositories/user-tokens.repository'

/**
 * Sends one of the links of rules 1.2 and 1.5: creates the single-use token, keeps only its hash and hands the
 * e-mail to the mailer. A new link replaces the earlier ones of the same kind, so only the last e-mail works.
 * Shared by sign-up, "send again" and "forgot my password"; it is a helper, not a use case.
 */
@Injectable()
export class AccountLinkSender {
  constructor(
    private readonly userTokensRepository: UserTokensRepository,
    private readonly opaqueTokens: OpaqueTokens,
    private readonly accountLinks: AccountLinks,
    private readonly mailer: Mailer,
  ) {}

  /** Stores the token. Call it inside the unit of work that must contain it. */
  async issue(user: User, kind: UserTokenKind, now: Date): Promise<MailMessage> {
    const userId = user.id.toString()
    const { token, hash } = this.opaqueTokens.issue()

    await this.userTokensRepository.invalidateAll(userId, kind, now)
    await this.userTokensRepository.create(UserToken.issue({ userId: user.id, kind, tokenHash: hash, now }))

    const recipient = { to: user.email.value, name: user.name, appName: this.accountLinks.appName }

    return kind === 'email_verification'
      ? emailVerificationMessage({ ...recipient, link: this.accountLinks.emailVerification(token) })
      : passwordResetMessage({ ...recipient, link: this.accountLinks.passwordReset(token) })
  }

  /** Stores the token and hands the e-mail over. */
  async send(user: User, kind: UserTokenKind, now: Date): Promise<void> {
    await this.mailer.send(await this.issue(user, kind, now))
  }
}
