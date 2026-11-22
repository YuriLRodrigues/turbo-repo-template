import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { DAY, HOUR, MINUTE, SECOND, TEST_NOW } from '../time/fake-clock'
import {
  api,
  clockOf,
  createAccount,
  createTestApp,
  lastEmailTo,
  lastTokenSentTo,
  signIn,
  type TestApp,
  WEB_ORIGIN,
} from './create-test-app'

const REFRESH_COOKIE = 'app.refresh_token'

/** The `Set-Cookie` line of the refresh cookie, if the response has one. */
const refreshCookieOf = (response: request.Response): string | undefined => {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined

  return cookies?.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`))
}

describe('auth (e2e)', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    clockOf(app).set(TEST_NOW)
  })

  const server = () => app.getHttpServer()

  it('GET /health answers without a token', async () => {
    await request(server()).get('/health').expect(200, { status: 'ok' })
  })

  describe('POST /auth/sign-up (rules 1.1 and 1.2)', () => {
    it('creates an account and never returns the password', async () => {
      const email = `Jane-${randomUUID()}@Example.com`

      const response = await request(server())
        .post('/auth/sign-up')
        .send({ name: 'Jane Doe', email, password: 'secret123' })
        .expect(201)

      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'Jane Doe',
        email: email.toLowerCase(),
        role: 'USER',
        emailVerified: false,
        createdAt: TEST_NOW.toISOString(),
      })
    })

    it('sends the confirmation e-mail, with a link to the web app', async () => {
      const email = `jane-${randomUUID()}@example.com`
      await request(server()).post('/auth/sign-up').send({ name: 'Jane Doe', email, password: 'secret123' })

      const message = lastEmailTo(app, email)

      expect(message?.subject).toBe('Confirm your e-mail for Example')
      expect(message?.text).toContain('Hi Jane,')
      expect(message?.text).toMatch(new RegExp(`${WEB_ORIGIN}/verify-email\\?token=[A-Za-z0-9_-]{43}`))
    })

    it('refuses an e-mail already registered', async () => {
      const { email } = await createAccount(app)

      const response = await request(server())
        .post('/auth/sign-up')
        .send({ name: 'Copy', email: email.toUpperCase(), password: 'secret123' })
        .expect(409)

      expect(response.body).toMatchObject({ statusCode: 409, code: 'USER.EMAIL_IN_USE' })
    })

    it('validates the shape of the body', async () => {
      const response = await request(server())
        .post('/auth/sign-up')
        .send({ name: '', email: 'not-an-email', password: 'short', admin: true })
        .expect(400)

      expect(response.body).toMatchObject({ statusCode: 400, code: 'VALIDATION.FAILED' })
      expect(response.body.details.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('admin'), expect.stringContaining('email')]),
      )
    })

    it('answers 422 for the business limits: name up to 60 characters, password from 8', async () => {
      const email = `jane-${randomUUID()}@example.com`

      const longName = await request(server())
        .post('/auth/sign-up')
        .send({ name: 'x'.repeat(61), email, password: 'secret123' })
        .expect(422)
      expect(longName.body).toMatchObject({ code: 'USER.INVALID_NAME', details: { maxLength: 60 } })

      const shortPassword = await request(server())
        .post('/auth/sign-up')
        .send({ name: 'Jane', email, password: '1234567' })
        .expect(422)
      expect(shortPassword.body).toMatchObject({ code: 'USER.WEAK_PASSWORD', details: { minLength: 8 } })
    })
  })

  describe('POST /auth/sign-in (rule 1.3)', () => {
    it('sets the refresh token as an httpOnly cookie for the web, and keeps it out of the body', async () => {
      const { email, password } = await createAccount(app)

      const response = await request(server())
        .post('/auth/sign-in')
        .set('Origin', WEB_ORIGIN)
        .send({ email, password })
        .expect(200)

      expect(response.body).toEqual({ accessToken: expect.any(String), expiresIn: 900 })
      const cookie = refreshCookieOf(response)
      expect(cookie).toMatch(new RegExp(`^${REFRESH_COOKIE}=[A-Za-z0-9_-]{43};`))
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Path=/auth')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain(`Expires=${new Date(TEST_NOW.getTime() + 30 * DAY).toUTCString()}`)
      expect(cookie).not.toContain('Secure')
    })

    it('returns the refresh token in the body for a native app, and sets no cookie', async () => {
      const { email, password } = await createAccount(app)

      const response = await request(server())
        .post('/auth/sign-in')
        .set('x-auth-transport', 'token')
        .send({ email, password })
        .expect(200)

      expect(response.body).toEqual({
        accessToken: expect.any(String),
        expiresIn: 900,
        refreshToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      })
      expect(refreshCookieOf(response)).toBeUndefined()
    })

    it('issues an access token that opens the private routes', async () => {
      const account = await createAccount(app)

      const response = await api(app, account).get('/me').expect(200)

      expect(response.body).toMatchObject({ id: account.id, email: account.email, role: 'USER' })
    })

    it('answers the same 401 for a wrong password and for an e-mail without an account (rule 1.4)', async () => {
      const { email } = await createAccount(app)

      const wrong = await request(server()).post('/auth/sign-in').send({ email, password: 'wrong-password' })
      const unknown = await request(server())
        .post('/auth/sign-in')
        .send({ email: `nobody-${randomUUID()}@example.com`, password: 'wrong-password' })

      expect(wrong.status).toBe(401)
      expect(unknown.status).toBe(401)
      expect(wrong.body).toEqual(unknown.body)
      expect(wrong.body).toMatchObject({ code: 'AUTH.INVALID_CREDENTIALS' })
    })

    it('blocks the e-mail for 15 minutes after five wrong passwords, and says for how long (rule 1.4)', async () => {
      const { email, password } = await createAccount(app)
      for (let attempt = 0; attempt < 5; attempt++) {
        await request(server()).post('/auth/sign-in').send({ email, password: 'wrong-password' }).expect(401)
      }

      const blocked = await request(server()).post('/auth/sign-in').send({ email, password }).expect(429)

      expect(blocked.body).toMatchObject({
        statusCode: 429,
        code: 'AUTH.TOO_MANY_ATTEMPTS',
        details: { retryAfterSeconds: 900 },
      })
      expect(blocked.headers['retry-after']).toBe('900')

      clockOf(app).advance(15 * MINUTE)
      await request(server()).post('/auth/sign-in').send({ email, password }).expect(200)
    })

    it('blocks an e-mail without an account in the same way (rule 1.4)', async () => {
      const email = `nobody-${randomUUID()}@example.com`
      for (let attempt = 0; attempt < 5; attempt++) {
        await request(server()).post('/auth/sign-in').send({ email, password: 'wrong-password' }).expect(401)
      }

      const blocked = await request(server()).post('/auth/sign-in').send({ email, password: 'wrong-password' })

      expect(blocked.status).toBe(429)
      expect(blocked.body.code).toBe('AUTH.TOO_MANY_ATTEMPTS')
    })
  })

  describe('POST /auth/refresh (rule 1.3)', () => {
    it('rotates the cookie: the new one works, the old one does not', async () => {
      const { email, password } = await createAccount(app)
      const agent = request.agent(server())
      const signedIn = await agent.post('/auth/sign-in').send({ email, password }).expect(200)
      const firstCookie = refreshCookieOf(signedIn)

      const refreshed = await agent.post('/auth/refresh').expect(200)

      expect(refreshed.body).toEqual({ accessToken: expect.any(String), expiresIn: 900 })
      expect(refreshCookieOf(refreshed)).toBeDefined()
      expect(refreshCookieOf(refreshed)).not.toBe(firstCookie)
      await api(app, refreshed.body).get('/me').expect(200)
      // The agent now holds the second cookie, and it works once more.
      await agent.post('/auth/refresh').expect(200)
    })

    it('rotates the token of a native app: body in, body out', async () => {
      const account = await createAccount(app)

      const refreshed = await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(200)

      expect(refreshed.body.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(refreshed.body.refreshToken).not.toBe(account.refreshToken)
      expect(refreshCookieOf(refreshed)).toBeUndefined()
      await api(app, refreshed.body).get('/me').expect(200)
    })

    it('ends the whole session when a token that was already exchanged is used again', async () => {
      const account = await createAccount(app)
      const refresh = (token: string) =>
        request(server()).post('/auth/refresh').set('x-auth-transport', 'token').set('x-refresh-token', token)

      const renewed = await refresh(account.refreshToken).expect(200)
      const replay = await refresh(account.refreshToken).expect(401)
      const afterwards = await refresh(renewed.body.refreshToken).expect(401)

      expect(replay.body).toMatchObject({ statusCode: 401, code: 'AUTH.REFRESH_TOKEN_REUSED' })
      expect(afterwards.body).toMatchObject({ code: 'AUTH.REFRESH_TOKEN_INVALID' })
    })

    it('lets only one of two simultaneous requests with the same token through', async () => {
      const account = await createAccount(app)
      const refresh = () =>
        request(server())
          .post('/auth/refresh')
          .set('x-auth-transport', 'token')
          .set('x-refresh-token', account.refreshToken)

      const responses = await Promise.all([refresh(), refresh()])

      expect(responses.map((response) => response.status).sort()).toEqual([200, 401])
      expect(responses.find((response) => response.status === 401)?.body.code).toBe('AUTH.REFRESH_TOKEN_REUSED')
    })

    it('answers 401 without a token, with an unknown one, and never reads the other transport', async () => {
      const account = await createAccount(app)

      const missing = await request(server()).post('/auth/refresh').expect(401)
      expect(missing.body).toMatchObject({ code: 'AUTH.REFRESH_TOKEN_INVALID' })

      await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', 'never-issued')
        .expect(401)

      // A valid token in the header, but the request did not ask for the token transport: it is ignored.
      await request(server()).post('/auth/refresh').set('x-refresh-token', account.refreshToken).expect(401)
      // A valid token as a cookie, but the request asked for the token transport: it is ignored as well.
      await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('Cookie', `${REFRESH_COOKIE}=${account.refreshToken}`)
        .expect(401)
    })

    it('clears the cookie when it stops being valid', async () => {
      const response = await request(server())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_COOKIE}=never-issued`)
        .expect(401)

      expect(refreshCookieOf(response)).toMatch(new RegExp(`^${REFRESH_COOKIE}=;`))
    })

    it('refuses a refresh token after 30 days', async () => {
      const account = await createAccount(app)
      clockOf(app).advance(30 * DAY)

      const response = await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(401)

      expect(response.body).toMatchObject({ code: 'AUTH.REFRESH_TOKEN_EXPIRED' })
    })
  })

  describe('POST /auth/sign-out (rule 1.3)', () => {
    it('ends the session and clears the cookie', async () => {
      const { email, password } = await createAccount(app)
      const agent = request.agent(server())
      await agent.post('/auth/sign-in').send({ email, password }).expect(200)

      const signedOut = await agent.post('/auth/sign-out').expect(204)

      expect(refreshCookieOf(signedOut)).toMatch(new RegExp(`^${REFRESH_COOKIE}=;`))
      await agent.post('/auth/refresh').expect(401)
    })

    it('ends the session of a native app', async () => {
      const account = await createAccount(app)

      await request(server())
        .post('/auth/sign-out')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(204)

      const response = await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(401)
      expect(response.body.code).toBe('AUTH.REFRESH_TOKEN_INVALID')
    })

    it('is idempotent and needs no token at all', async () => {
      await request(server()).post('/auth/sign-out').expect(204)
      await request(server()).post('/auth/sign-out').set('Cookie', `${REFRESH_COOKIE}=never-issued`).expect(204)
    })
  })

  describe('cookies and origins', () => {
    it('answers the preflight of the web app with credentials allowed, and of no other origin', async () => {
      const allowed = await request(server())
        .options('/auth/sign-in')
        .set('Origin', WEB_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-auth-transport')

      expect(allowed.status).toBe(204)
      expect(allowed.headers['access-control-allow-origin']).toBe(WEB_ORIGIN)
      expect(allowed.headers['access-control-allow-credentials']).toBe('true')
      expect(allowed.headers['access-control-allow-headers']).toContain('x-auth-transport')

      const stranger = await request(server())
        .options('/auth/sign-in')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'POST')

      expect(stranger.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('refuses the cookie routes to a browser on another origin', async () => {
      const { email, password, refreshToken } = await createAccount(app)

      const signInAttempt = await request(server())
        .post('/auth/sign-in')
        .set('Origin', 'https://evil.example')
        .send({ email, password })
        .expect(403)
      expect(signInAttempt.body).toMatchObject({ statusCode: 403, code: 'HTTP.FORBIDDEN' })
      expect(refreshCookieOf(signInAttempt)).toBeUndefined()

      await request(server())
        .post('/auth/refresh')
        .set('Origin', 'https://evil.example')
        .set('Cookie', `${REFRESH_COOKIE}=${refreshToken}`)
        .expect(403)
      await request(server()).post('/auth/sign-out').set('Origin', 'https://evil.example').expect(403)
    })

    it('does not apply the origin check to the token transport, which carries no cookie', async () => {
      const { email, password } = await createAccount(app)

      await request(server())
        .post('/auth/sign-in')
        .set('Origin', 'capacitor://localhost')
        .set('x-auth-transport', 'token')
        .send({ email, password })
        .expect(200)
    })
  })

  describe('e-mail confirmation (rule 1.2)', () => {
    it('confirms the e-mail with the token of the link, once', async () => {
      const account = await createAccount(app)
      const token = lastTokenSentTo(app, account.email)

      const confirmed = await request(server()).post('/auth/verify-email').send({ token }).expect(200)
      expect(confirmed.body).toMatchObject({ id: account.id, emailVerified: true })

      const me = await api(app, account).get('/me').expect(200)
      expect(me.body.emailVerified).toBe(true)

      const again = await request(server()).post('/auth/verify-email').send({ token }).expect(422)
      expect(again.body).toMatchObject({ code: 'AUTH.VERIFICATION_TOKEN_INVALID' })
    })

    it('refuses an unknown token and one older than 24 hours', async () => {
      const account = await createAccount(app)
      const token = lastTokenSentTo(app, account.email)

      const unknown = await request(server()).post('/auth/verify-email').send({ token: 'never-issued' }).expect(422)
      expect(unknown.body.code).toBe('AUTH.VERIFICATION_TOKEN_INVALID')

      clockOf(app).advance(24 * HOUR)
      const expired = await request(server()).post('/auth/verify-email').send({ token }).expect(422)
      expect(expired.body.code).toBe('AUTH.VERIFICATION_TOKEN_EXPIRED')
    })

    it('sends the link again at most once per minute, and the new link replaces the old one', async () => {
      const account = await createAccount(app)
      const firstToken = lastTokenSentTo(app, account.email)

      clockOf(app).advance(20 * SECOND)
      const tooSoon = await api(app, account).post('/auth/verify-email/resend').expect(429)
      expect(tooSoon.body).toMatchObject({
        code: 'AUTH.VERIFICATION_RESEND_TOO_SOON',
        details: { retryAfterSeconds: 40 },
      })
      expect(tooSoon.headers['retry-after']).toBe('40')

      clockOf(app).advance(40 * SECOND)
      await api(app, account).post('/auth/verify-email/resend').expect(204)
      const secondToken = lastTokenSentTo(app, account.email)

      expect(secondToken).not.toBe(firstToken)
      await request(server()).post('/auth/verify-email').send({ token: firstToken }).expect(422)
      await request(server()).post('/auth/verify-email').send({ token: secondToken }).expect(200)

      clockOf(app).advance(2 * MINUTE)
      const verified = await api(app, account).post('/auth/verify-email/resend').expect(409)
      expect(verified.body.code).toBe('AUTH.EMAIL_ALREADY_VERIFIED')
    })

    it('needs a session to send the link again', async () => {
      await request(server()).post('/auth/verify-email/resend').expect(401)
    })
  })

  describe('password reset (rule 1.5)', () => {
    it('answers the same 204 whether or not the e-mail has an account', async () => {
      const account = await createAccount(app)
      const stranger = `nobody-${randomUUID()}@example.com`

      const known = await request(server()).post('/auth/forgot-password').send({ email: account.email })
      const unknown = await request(server()).post('/auth/forgot-password').send({ email: stranger })
      const malformed = await request(server()).post('/auth/forgot-password').send({ email: 'not-an-email' })

      expect([known.status, unknown.status, malformed.status]).toEqual([204, 204, 204])
      expect([known.body, unknown.body, malformed.body]).toEqual([{}, {}, {}])
      expect(lastEmailTo(app, account.email)?.subject).toBe('Choose a new password for Example')
      expect(lastEmailTo(app, account.email)?.text).toContain(`${WEB_ORIGIN}/reset-password?token=`)
      expect(lastEmailTo(app, stranger)).toBeUndefined()
    })

    it('changes the password with the link, once, and ends every session', async () => {
      const account = await createAccount(app)
      await request(server()).post('/auth/forgot-password').send({ email: account.email }).expect(204)
      const token = lastTokenSentTo(app, account.email)

      await request(server()).post('/auth/reset-password').send({ token, password: 'a-new-secret' }).expect(204)

      // The session that was open is gone, the old password too.
      await request(server())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(401)
      await request(server())
        .post('/auth/sign-in')
        .send({ email: account.email, password: account.password })
        .expect(401)
      await signIn(app, account.email, 'a-new-secret')

      const again = await request(server())
        .post('/auth/reset-password')
        .send({ token, password: 'another-secret' })
        .expect(422)
      expect(again.body.code).toBe('AUTH.PASSWORD_RESET_TOKEN_INVALID')
    })

    it('refuses the link after 1 hour, and a short password without spending the link', async () => {
      const account = await createAccount(app)
      await request(server()).post('/auth/forgot-password').send({ email: account.email })
      const token = lastTokenSentTo(app, account.email)

      const short = await request(server()).post('/auth/reset-password').send({ token, password: '1234567' })
      expect(short.status).toBe(422)
      expect(short.body.code).toBe('USER.WEAK_PASSWORD')

      clockOf(app).advance(HOUR)
      const expired = await request(server()).post('/auth/reset-password').send({ token, password: 'a-new-secret' })
      expect(expired.status).toBe(422)
      expect(expired.body.code).toBe('AUTH.PASSWORD_RESET_TOKEN_EXPIRED')
    })
  })

  it('GET /me answers 401 without a token or with a forged one', async () => {
    const missing = await request(server()).get('/me').expect(401)
    expect(missing.body).toMatchObject({ code: 'HTTP.UNAUTHORIZED' })

    await request(server()).get('/me').auth('not.a.token', { type: 'bearer' }).expect(401)
  })
})

describe('the rate limit of the public routes (e2e)', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp({ env: { PUBLIC_RATE_LIMIT: '3', PUBLIC_RATE_WINDOW_SECONDS: '60' } })
  })

  afterAll(async () => {
    await app.close()
  })

  it('answers 429 after the limit, per route, and leaves the health check and the private routes alone', async () => {
    const body = { email: 'nobody@example.com' }
    for (let call = 0; call < 3; call++) {
      await request(app.getHttpServer()).post('/auth/forgot-password').send(body).expect(204)
    }

    const limited = await request(app.getHttpServer()).post('/auth/forgot-password').send(body).expect(429)
    expect(limited.body).toMatchObject({ statusCode: 429, code: 'HTTP.TOO_MANY_REQUESTS' })

    // Another public route has its own count.
    await request(app.getHttpServer()).post('/auth/sign-out').expect(204)

    for (let call = 0; call < 6; call++) {
      await request(app.getHttpServer()).get('/health').expect(200)
      await request(app.getHttpServer()).get('/me').expect(401)
    }
  })
})
