import { Module } from '@nestjs/common'
import { createTransport } from 'nodemailer'

import { AccountLinks } from '@domain/identity/applications/mail/account-links'
import { Mailer } from '@domain/identity/applications/mail/mailer'
import { EnvService } from '@infra/env/env.service'

import { LogMailer } from './log-mailer'
import { SmtpMailer } from './smtp-mailer'
import { WebAccountLinks } from './web-account-links'

/** Rule 1.2: with `SMTP_HOST` the e-mails go out by SMTP; without it they are written to the log. */
export function createMailer(env: EnvService): Mailer {
  const host = env.get('SMTP_HOST')
  if (!host) return new LogMailer()

  const user = env.get('SMTP_USER')
  const pass = env.get('SMTP_PASSWORD')
  const transport = createTransport({
    host,
    port: env.get('SMTP_PORT'),
    secure: env.get('SMTP_SECURE'),
    ...(user && pass ? { auth: { user, pass } } : {}),
  })

  return new SmtpMailer(transport, env.get('MAIL_FROM'))
}

/** For the boot checklist: where an e-mail goes on this run. */
export function describeMailer(env: EnvService): string {
  const host = env.get('SMTP_HOST')

  return host ? `SMTP ${host}:${env.get('SMTP_PORT')}` : 'written to the log (no SMTP_HOST)'
}

@Module({
  providers: [
    { provide: Mailer, inject: [EnvService], useFactory: createMailer },
    { provide: AccountLinks, useClass: WebAccountLinks },
  ],
  exports: [Mailer, AccountLinks],
})
export class MailModule {}
