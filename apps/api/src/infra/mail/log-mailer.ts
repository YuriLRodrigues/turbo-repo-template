import { Injectable, Logger } from '@nestjs/common'

import type { Mailer, MailMessage } from '@domain/identity/applications/mail/mailer'

const OUTBOX_SIZE = 50

/**
 * Rule 1.2: in development and in tests the e-mail goes to the log instead of a mail server. The whole message is
 * written, link included, because reading it there is the only way to open the link. That is why this adapter is
 * never the one in production: `SMTP_HOST` is required there (`infra/env/env.ts`).
 *
 * The last messages are also kept in memory, so the e2e suite can read a link without scraping the log.
 */
@Injectable()
export class LogMailer implements Mailer {
  private readonly logger = new Logger('Mailer')
  readonly outbox: MailMessage[] = []

  send(message: MailMessage): Promise<void> {
    this.outbox.push(message)
    if (this.outbox.length > OUTBOX_SIZE) this.outbox.shift()

    this.logger.log(`E-mail to ${message.to}: ${message.subject}\n${message.text}`)

    return Promise.resolve()
  }
}
