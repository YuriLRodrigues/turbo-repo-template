import { randomUUID } from 'node:crypto'

import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { inject } from 'vitest'

import type { Role } from '@core/auth/actor'
import { Clock } from '@core/time/clock'
import { Mailer, type MailMessage } from '@domain/identity/applications/mail/mailer'
import { DrizzleService } from '@infra/database/drizzle/drizzle.service'
import { users } from '@infra/database/drizzle/schema'
import type { LogMailer } from '@infra/mail/log-mailer'
import { setupHttp } from '@presentations/http/http-setup'

import { AppModule } from '../../src/app.module'
import { tokenIn } from '../mail/fake-mailer'
import { FakeClock } from '../time/fake-clock'

export type TestApp = NestExpressApplication

/** The origin the e2e app accepts cookies and CORS requests from. */
export const WEB_ORIGIN = 'http://localhost:3501'

export type TestAppOptions = {
  /** Environment variables for this app only (the rate limit, the cookie attributes...). */
  env?: Record<string, string>
}

/**
 * The real AppModule (guards, filter, pipe, Drizzle) against the database prepared by `global-setup.ts`.
 *
 * The clock is a `FakeClock` standing at `TEST_NOW` (14 November 2026, 15:00 UTC): "today" is the same on
 * every run, and a test moves time with `clockOf(app).advance(...)`. E-mails go to the log mailer, whose outbox the
 * tests read with `lastEmailTo(app, address)`.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: inject('databaseUrl'),
    DATABASE_POOL_MAX: String(inject('databasePoolMax')),
    APP_NAME: 'Example',
    JWT_SECRET: 'e2e-secret-with-at-least-thirty-two-characters',
    CORS_ORIGINS: WEB_ORIGIN,
    WEB_APP_URL: WEB_ORIGIN,
    AUTH_COOKIE_SAME_SITE: 'lax',
    // Every spec signs up and signs in many times from the same address: the limit has its own spec.
    PUBLIC_RATE_LIMIT: '100000',
    PUBLIC_RATE_WINDOW_SECONDS: '60',
    ...options.env,
  })
  delete process.env.SMTP_HOST

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(new FakeClock())
    .compile()
  const app = moduleRef.createNestApplication<TestApp>({ logger: false })
  setupHttp(app)
  await app.init()

  return app
}

export const clockOf = (app: TestApp): FakeClock => app.get<Clock, FakeClock>(Clock)

/** The last e-mail the app "sent" to this address. */
export function lastEmailTo(app: TestApp, address: string): MailMessage | undefined {
  const mailer = app.get<Mailer, LogMailer>(Mailer)

  return mailer.outbox.findLast((message) => message.to === address.toLowerCase())
}

/** The token of the link in the last e-mail sent to this address. */
export const lastTokenSentTo = (app: TestApp, address: string): string => tokenIn(lastEmailTo(app, address))

export type TestAccount = {
  id: string
  email: string
  password: string
  accessToken: string
  /** The refresh token of the session, as a native app would hold it. */
  refreshToken: string
}

/** Signs up a brand-new account (unique e-mail), optionally promotes it, and signs in. */
export async function createAccount(app: TestApp, role: Role = 'USER'): Promise<TestAccount> {
  const email = `e2e-${randomUUID()}@example.com`
  const password = 'secret123'

  const signUp = await request(app.getHttpServer()).post('/auth/sign-up').send({ name: 'E2E User', email, password })
  if (signUp.status !== 201) throw new Error(`sign-up failed: ${signUp.status} ${JSON.stringify(signUp.body)}`)

  if (role !== 'USER') {
    await app.get(DrizzleService).db.update(users).set({ role }).where(eq(users.email, email))
  }

  const tokens = await signIn(app, email, password)

  return { id: (signUp.body as { id: string }).id, email, password, ...tokens }
}

/** Signs in the way a native app does: the refresh token comes in the body. */
export async function signIn(
  app: TestApp,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .set('x-auth-transport', 'token')
    .send({ email, password })
  if (response.status !== 200) throw new Error(`sign-in failed: ${response.status} ${JSON.stringify(response.body)}`)

  return response.body as { accessToken: string; refreshToken: string }
}

/** `api(app, account).get('/me')`: a request already carrying the access token of the account. */
export function api(app: TestApp, account: Pick<TestAccount, 'accessToken'>) {
  const server = app.getHttpServer()
  const bearer = { type: 'bearer' } as const

  return {
    get: (path: string) => request(server).get(path).auth(account.accessToken, bearer),
    post: (path: string) => request(server).post(path).auth(account.accessToken, bearer),
    patch: (path: string) => request(server).patch(path).auth(account.accessToken, bearer),
    delete: (path: string) => request(server).delete(path).auth(account.accessToken, bearer),
  }
}
