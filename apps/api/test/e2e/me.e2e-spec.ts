import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { HOUR, TEST_NOW } from '../time/fake-clock'
import { api, clockOf, createAccount, createTestApp, signIn, type TestApp } from './create-test-app'

const DEFAULT_PREFERENCES = {
  appearance: { theme: 'system', accent: 'neutral', density: 'comfortable', reduceMotion: false },
  timeZone: 'UTC',
  onboarding: { status: 'pending', currentStep: 'welcome', completedSteps: [], skippedSteps: [] },
  updatedAt: null,
}

describe('me (e2e)', () => {
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

  describe('preferences (rule 1.7)', () => {
    it('GET /me/preferences answers the defaults before anything is changed', async () => {
      const account = await createAccount(app)

      const response = await api(app, account).get('/me/preferences').expect(200)

      expect(response.body).toEqual(DEFAULT_PREFERENCES)
    })

    it('PATCH /me/preferences changes only what was sent, at every level, and keeps it', async () => {
      const account = await createAccount(app)

      const first = await api(app, account)
        .patch('/me/preferences')
        .send({ appearance: { theme: 'dark', accent: 'violet' }, timeZone: 'Europe/Lisbon' })
        .expect(200)
      expect(first.body).toEqual({
        ...DEFAULT_PREFERENCES,
        appearance: { ...DEFAULT_PREFERENCES.appearance, theme: 'dark', accent: 'violet' },
        timeZone: 'Europe/Lisbon',
        updatedAt: TEST_NOW.toISOString(),
      })

      clockOf(app).advance(HOUR)
      await api(app, account)
        .patch('/me/preferences')
        .send({
          appearance: { reduceMotion: true },
          onboarding: { currentStep: 'appearance', completedSteps: ['profile', 'welcome'], skippedSteps: [] },
        })
        .expect(200)

      const saved = await api(app, account).get('/me/preferences').expect(200)
      expect(saved.body).toEqual({
        appearance: { ...DEFAULT_PREFERENCES.appearance, theme: 'dark', accent: 'violet', reduceMotion: true },
        timeZone: 'Europe/Lisbon',
        onboarding: {
          status: 'pending',
          currentStep: 'appearance',
          completedSteps: ['welcome', 'profile'],
          skippedSteps: [],
        },
        updatedAt: new Date(TEST_NOW.getTime() + HOUR).toISOString(),
      })
    })

    it('keeps the preferences of each person apart', async () => {
      const jane = await createAccount(app)
      const john = await createAccount(app)
      await api(app, jane)
        .patch('/me/preferences')
        .send({ appearance: { theme: 'dark' } })
        .expect(200)

      const response = await api(app, john).get('/me/preferences').expect(200)

      expect(response.body).toEqual(DEFAULT_PREFERENCES)
    })

    it.each([
      [{ appearance: { accent: 'pink' } }, 'PREFERENCES.INVALID_APPEARANCE'],
      [{ timeZone: 'Mars/Olympus' }, 'PREFERENCES.INVALID_TIME_ZONE'],
      [{ onboarding: { completedSteps: ['profile'], skippedSteps: ['profile'] } }, 'PREFERENCES.INVALID_ONBOARDING'],
    ])('answers 422 for %j and saves nothing', async (body, code) => {
      const account = await createAccount(app)

      const response = await api(app, account).patch('/me/preferences').send(body).expect(422)

      expect(response.body).toMatchObject({ statusCode: 422, code })
      expect((await api(app, account).get('/me/preferences')).body).toEqual(DEFAULT_PREFERENCES)
    })

    it('answers 400 for a body of the wrong shape', async () => {
      const account = await createAccount(app)

      const response = await api(app, account)
        .patch('/me/preferences')
        .send({ appearance: { theme: 3, sparkle: true }, onboarding: { status: 7 }, role: 'ADMIN' })
        .expect(400)

      expect(response.body.code).toBe('VALIDATION.FAILED')
      expect(response.body.details.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('role'),
          expect.stringContaining('sparkle'),
          expect.stringContaining('theme'),
          expect.stringContaining('status'),
        ]),
      )
    })

    it('needs a session', async () => {
      await request(app.getHttpServer()).get('/me/preferences').expect(401)
      await request(app.getHttpServer()).patch('/me/preferences').send({}).expect(401)
    })
  })

  describe('sessions (rule 1.3)', () => {
    it('GET /me/sessions lists where the person is signed in and marks the current one', async () => {
      const account = await createAccount(app)
      clockOf(app).advance(HOUR)
      const laptop = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .set('x-auth-transport', 'token')
        .set('User-Agent', 'Laptop browser')
        .send({ email: account.email, password: account.password })
        .expect(200)

      const response = await api(app, laptop.body).get('/me/sessions').expect(200)

      expect(response.body.meta).toEqual({ page: 1, limit: 20, totalItems: 2, totalPages: 1 })
      expect(response.body.results).toEqual([
        {
          id: expect.any(String),
          current: true,
          userAgent: 'Laptop browser',
          createdAt: new Date(TEST_NOW.getTime() + HOUR).toISOString(),
          lastUsedAt: new Date(TEST_NOW.getTime() + HOUR).toISOString(),
          expiresAt: new Date(TEST_NOW.getTime() + HOUR + 30 * 24 * HOUR).toISOString(),
        },
        expect.objectContaining({ current: false, createdAt: TEST_NOW.toISOString() }),
      ])
      expect(JSON.stringify(response.body)).not.toContain(account.refreshToken)
    })

    it('keeps one session per sign-in when its token is renewed', async () => {
      const account = await createAccount(app)
      clockOf(app).advance(HOUR)
      const renewed = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', account.refreshToken)
        .expect(200)

      const response = await api(app, renewed.body).get('/me/sessions').expect(200)

      expect(response.body.results).toEqual([
        expect.objectContaining({
          current: true,
          createdAt: TEST_NOW.toISOString(),
          lastUsedAt: new Date(TEST_NOW.getTime() + HOUR).toISOString(),
        }),
      ])
    })

    it('DELETE /me/sessions/:id ends that session only', async () => {
      const account = await createAccount(app)
      const other = await signIn(app, account.email, account.password)
      const sessions = await api(app, account).get('/me/sessions').expect(200)
      const otherId = sessions.body.results.find((session: { current: boolean }) => !session.current).id

      await api(app, account).delete(`/me/sessions/${otherId}`).expect(204)

      const refresh = (token: string) =>
        request(app.getHttpServer())
          .post('/auth/refresh')
          .set('x-auth-transport', 'token')
          .set('x-refresh-token', token)
      await refresh(other.refreshToken).expect(401)
      await refresh(account.refreshToken).expect(200)
      const again = await api(app, account).delete(`/me/sessions/${otherId}`).expect(404)
      expect(again.body).toMatchObject({ statusCode: 404, code: 'SESSION.NOT_FOUND' })
    })

    it("answers 404 for someone else's session, and 400 for an id that is not a UUID (rule 0.4)", async () => {
      const jane = await createAccount(app)
      const john = await createAccount(app)
      const sessions = await api(app, john).get('/me/sessions').expect(200)

      const response = await api(app, jane).delete(`/me/sessions/${sessions.body.results[0].id}`).expect(404)
      expect(response.body.code).toBe('SESSION.NOT_FOUND')

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', john.refreshToken)
        .expect(200)
      await api(app, jane).delete('/me/sessions/not-a-uuid').expect(400)
    })
  })
})
