import type { AccountLinks } from '@domain/identity/applications/mail/account-links'
import type { Mailer, MailMessage } from '@domain/identity/applications/mail/mailer'

/** Keeps what would have been sent. */
export class FakeMailer implements Mailer {
  sent: MailMessage[] = []

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message)
  }

  get last(): MailMessage | undefined {
    return this.sent.at(-1)
  }
}

/** Links a test can read the token back from: `https://app.test/verify-email?token=token-1`. */
export class FakeAccountLinks implements AccountLinks {
  readonly appName = 'Example'

  emailVerification(token: string): string {
    return `https://app.test/verify-email?token=${token}`
  }

  passwordReset(token: string): string {
    return `https://app.test/reset-password?token=${token}`
  }
}

/** The token inside the link of an e-mail. */
export function tokenIn(message: MailMessage | undefined): string {
  const token = /[?&]token=([^\s&]+)/.exec(message?.text ?? '')?.[1]
  if (!token) throw new Error('the e-mail has no link with a token')

  return decodeURIComponent(token)
}
