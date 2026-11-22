import { Logger, type OnModuleDestroy } from '@nestjs/common'

import type { Mailer, MailMessage } from '@domain/identity/applications/mail/mailer'

/** What this adapter needs from nodemailer's transporter. A test passes a stub with the same shape. */
export type MailTransport = {
  sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>
  close?: () => void
}

/**
 * Hands the message to an SMTP server (nodemailer). As the `Mailer` port asks, `send` returns right away: the
 * delivery runs in the background and a failure is logged, never thrown. The log line carries the subject only,
 * not the recipient and not the body (which has a link that signs someone in).
 */
export class SmtpMailer implements Mailer, OnModuleDestroy {
  private readonly logger = new Logger('Mailer')
  private readonly pending = new Set<Promise<void>>()

  constructor(
    private readonly transport: MailTransport,
    private readonly from: string,
  ) {}

  send(message: MailMessage): Promise<void> {
    const delivery: Promise<void> = this.transport
      .sendMail({ from: this.from, to: message.to, subject: message.subject, text: message.text })
      .then(() => undefined)
      .catch((error: unknown) => {
        this.logger.warn(`Could not deliver the e-mail "${message.subject}"`)
        this.logger.error(error instanceof Error ? error : String(error))
      })
      .finally(() => this.pending.delete(delivery))

    this.pending.add(delivery)

    return Promise.resolve()
  }

  /** Waits for the deliveries in flight: on shutdown, and in tests. */
  async flush(): Promise<void> {
    await Promise.all(this.pending)
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush()
    this.transport.close?.()
  }
}
