import { Logger } from '@nestjs/common'
import { createTransport } from 'nodemailer'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

import type { MailMessage } from '@domain/identity/applications/mail/mailer'
import { parseEnv } from '@infra/env/env'
import { EnvService } from '@infra/env/env.service'

import { LogMailer } from './log-mailer'
import { createMailer, describeMailer } from './mail.module'
import { type MailTransport, SmtpMailer } from './smtp-mailer'
import { WebAccountLinks } from './web-account-links'

const message: MailMessage = {
  to: 'jane@example.com',
  subject: 'Confirm your e-mail for Example',
  text: 'Hi Jane,\n\nhttps://app.test/verify-email?token=abc',
}

const envWith = (extra: Record<string, string> = {}) =>
  new EnvService(
    parseEnv({ JWT_SECRET: 'x'.repeat(32), DATABASE_URL: 'postgresql://app:app@localhost:5432/app', ...extra }),
  )

/** What the adapters wrote to the application log, without printing it during the run. */
let logged: { log: MockInstance; warn: MockInstance; error: MockInstance }

beforeEach(() => {
  logged = {
    log: vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined),
    warn: vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LogMailer (rule 1.2: development and tests)', () => {
  it('writes the whole e-mail to the log, link included', async () => {
    await new LogMailer().send(message)

    expect(logged.log).toHaveBeenCalledWith(
      'E-mail to jane@example.com: Confirm your e-mail for Example\nHi Jane,\n\nhttps://app.test/verify-email?token=abc',
    )
  })

  it('keeps what was sent, newest last, and only the last 50', async () => {
    const mailer = new LogMailer()

    for (let index = 0; index < 55; index++) {
      await mailer.send({ ...message, subject: `Message ${index}` })
    }

    expect(mailer.outbox).toHaveLength(50)
    expect(mailer.outbox.at(0)?.subject).toBe('Message 5')
    expect(mailer.outbox.at(-1)?.subject).toBe('Message 54')
  })
})

describe('SmtpMailer (rule 1.2: production)', () => {
  it('hands the message to the transport with the configured sender', async () => {
    // nodemailer's JSON transport builds the message exactly as SMTP would, and sends nothing.
    const transport = createTransport({ jsonTransport: true })
    const sendMail = vi.spyOn(transport, 'sendMail')
    const mailer = new SmtpMailer(transport, 'Example <no-reply@example.test>')

    await mailer.send(message)
    await mailer.flush()

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Example <no-reply@example.test>',
      to: 'jane@example.com',
      subject: 'Confirm your e-mail for Example',
      text: message.text,
    })
    const info = (await sendMail.mock.results[0].value) as { message: string }
    expect(JSON.parse(info.message)).toMatchObject({
      from: { address: 'no-reply@example.test', name: 'Example' },
      to: [{ address: 'jane@example.com' }],
      subject: 'Confirm your e-mail for Example',
    })
  })

  it('returns before the mail server answers', async () => {
    let deliver: () => void = () => undefined
    const transport: MailTransport = { sendMail: () => new Promise<void>((resolve) => (deliver = resolve)) }
    const mailer = new SmtpMailer(transport, 'Example <no-reply@example.test>')

    await mailer.send(message)

    let flushed = false
    const flushing = mailer.flush().then(() => (flushed = true))
    await Promise.resolve()
    expect(flushed).toBe(false)

    deliver()
    await flushing
    expect(flushed).toBe(true)
  })

  it('does not throw when the delivery fails: it logs the error, and neither the recipient nor the link', async () => {
    const failure = new Error('connection refused')
    const transport: MailTransport = { sendMail: () => Promise.reject(failure) }
    const mailer = new SmtpMailer(transport, 'Example <no-reply@example.test>')

    await expect(mailer.send(message)).resolves.toBeUndefined()
    await expect(mailer.flush()).resolves.toBeUndefined()

    expect(logged.error).toHaveBeenCalledWith(failure)
    expect(logged.warn).toHaveBeenCalledWith('Could not deliver the e-mail "Confirm your e-mail for Example"')
    const everything = JSON.stringify([logged.warn.mock.calls, logged.log.mock.calls])
    expect(everything).not.toContain('jane@example.com')
    expect(everything).not.toContain('token=')
  })

  it('waits for what is in flight and closes the transport on shutdown', async () => {
    const close = vi.fn()
    const sendMail = vi.fn().mockResolvedValue(undefined)
    const mailer = new SmtpMailer({ sendMail, close }, 'Example <no-reply@example.test>')

    await mailer.send(message)
    await mailer.onModuleDestroy()

    expect(sendMail).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })
})

describe('createMailer (rule 1.2)', () => {
  it('writes to the log when there is no SMTP server', () => {
    const env = envWith()

    expect(createMailer(env)).toBeInstanceOf(LogMailer)
    expect(describeMailer(env)).toBe('written to the log (no SMTP_HOST)')
  })

  it('uses SMTP when a host is configured', () => {
    const env = envWith({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_SECURE: 'true' })

    expect(createMailer(env)).toBeInstanceOf(SmtpMailer)
    expect(describeMailer(env)).toBe('SMTP smtp.example.com:465')
  })
})

describe('WebAccountLinks', () => {
  it('points to the pages of the web app, with the token escaped', () => {
    const links = new WebAccountLinks(envWith({ WEB_APP_URL: 'https://app.example.test/' }))

    expect(links.emailVerification('a b+c')).toBe('https://app.example.test/verify-email?token=a%20b%2Bc')
    expect(links.passwordReset('abc')).toBe('https://app.example.test/reset-password?token=abc')
  })

  it('keeps a base path', () => {
    const links = new WebAccountLinks(envWith({ WEB_APP_URL: 'https://example.com/app' }))

    expect(links.emailVerification('abc')).toBe('https://example.com/app/verify-email?token=abc')
  })
})
