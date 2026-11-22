import type { MailMessage } from './mailer'

/**
 * The e-mails of the identity context: plain and short product copy, in English. Translate them here when the
 * product speaks another language (the specs next to this file pin the exact words).
 * The durations in the text are the ones of rules 1.2 and 1.5 (`enterprise/identity-rules.ts`).
 */

type MessageInput = {
  to: string
  name: string
  link: string
  /** The product name, said in the subject and in the body (`APP_NAME`). */
  appName: string
}

const firstNameOf = (name: string): string => name.trim().split(/\s+/)[0] ?? ''

const greeting = (name: string): string => {
  const firstName = firstNameOf(name)

  return firstName ? `Hi ${firstName},` : 'Hi,'
}

export function emailVerificationMessage(input: MessageInput): MailMessage {
  return {
    to: input.to,
    subject: `Confirm your e-mail for ${input.appName}`,
    text: [
      greeting(input.name),
      '',
      `To confirm your e-mail for ${input.appName}, open the link below. It is valid for 24 hours.`,
      '',
      input.link,
      '',
      `If you did not create an account on ${input.appName}, ignore this message.`,
    ].join('\n'),
  }
}

export function passwordResetMessage(input: MessageInput): MailMessage {
  return {
    to: input.to,
    subject: `Choose a new password for ${input.appName}`,
    text: [
      greeting(input.name),
      '',
      `We received a request to change the password of your ${input.appName} account. To choose a new one, open the link below.`,
      'It is valid for 1 hour and works only once.',
      '',
      input.link,
      '',
      'If you did not ask for this, ignore this message: your password stays the same.',
    ].join('\n'),
  }
}
