export type MailMessage = {
  to: string
  subject: string
  /** Plain text. The messages of the app are short and have no HTML version. */
  text: string
}

/**
 * Rule 1.2: every e-mail leaves through this port. In development and tests the adapter writes the message to the
 * log; in production it hands it to the SMTP server configured in the environment.
 *
 * `send` hands the message over for delivery and returns. It does not wait for the mail server and does not reject
 * when delivery fails (the adapter logs it): a use case must never fail, or take longer, because of the mail
 * server, or "if the e-mail exists we sent the link" would give away who has an account.
 */
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>
}
