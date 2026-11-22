import { count, eq } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { DrizzleService } from '@infra/database/drizzle/drizzle.service'
import {
  notes,
  refreshTokens,
  signInAttempts,
  userPreferences,
  users,
  userTokens,
} from '@infra/database/drizzle/schema'

import { MINUTE, TEST_NOW, TEST_TODAY } from '../time/fake-clock'
import { api, clockOf, createAccount, createTestApp, type TestAccount, type TestApp } from './create-test-app'

const REFRESH_COOKIE = 'app.refresh_token'

type Json = Record<string, unknown>

describe('my data (e2e, rule 1.6)', () => {
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

  const tick = () => clockOf(app).advance(MINUTE)

  const writeNote = async (person: TestAccount, body: Json): Promise<Json> =>
    (await api(app, person).post('/notes').send(body).expect(201)).body as Json

  /** A person who used a bit of everything: preferences, a note, a pinned one and an archived one. */
  async function personWithData(): Promise<{ person: TestAccount; first: Json; archived: Json }> {
    const person = await createAccount(app)
    tick()
    const first = await writeNote(person, { title: 'Groceries', body: 'Milk\nBread' })
    tick()
    await writeNote(person, { title: 'Pinned', pinned: true })
    tick()
    const archived = await writeNote(person, { title: 'Old idea' })
    await api(app, person)
      .patch(`/notes/${String(archived.id)}/archive`)
      .expect(200)
    await api(app, person)
      .patch('/me/preferences')
      .send({ appearance: { theme: 'dark' } })
      .expect(200)

    return { person, first, archived }
  }

  describe('GET /me/export', () => {
    it('downloads everything that is mine as one JSON file, section by section', async () => {
      const { person, first, archived } = await personWithData()
      const stranger = await createAccount(app)
      await writeNote(stranger, { title: 'Secret of someone else' })
      clockOf(app).set(TEST_NOW)

      const response = await api(app, person).get('/me/export').expect(200)

      expect(response.headers['content-disposition']).toBe(`attachment; filename=account-export-${TEST_TODAY}.json`)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.body).toMatchObject({ format: 'app.export', version: 1, exportedAt: TEST_NOW.toISOString() })
      expect(Object.keys(response.body.data)).toEqual(['identity', 'notes'])

      const { identity, notes: ownNotes } = response.body.data

      expect(identity.profile).toEqual({
        id: person.id,
        name: 'E2E User',
        email: person.email,
        emailVerifiedAt: null,
        createdAt: TEST_NOW.toISOString(),
      })
      expect(identity.preferences).toMatchObject({ appearance: { theme: 'dark' }, timeZone: 'UTC' })
      expect(identity.sessions).toHaveLength(1)

      // Oldest first, the archived one included.
      expect(ownNotes.notes.map((note: Json) => note.title)).toEqual(['Groceries', 'Pinned', 'Old idea'])
      expect(ownNotes.notes[0]).toEqual({
        id: first.id,
        title: 'Groceries',
        body: 'Milk\nBread',
        pinned: false,
        archivedAt: null,
        createdAt: new Date(TEST_NOW.getTime() + MINUTE).toISOString(),
        updatedAt: new Date(TEST_NOW.getTime() + MINUTE).toISOString(),
      })
      expect(ownNotes.notes[2]).toMatchObject({ id: archived.id, archivedAt: expect.any(String) })

      // Nothing of anyone else, and no secret.
      const text = JSON.stringify(response.body)
      expect(text).not.toContain('someone else')
      expect(text).not.toContain(person.password)
      expect(text).not.toContain(person.refreshToken)
      expect(text).not.toMatch(/hash/i)
    })

    it("names the file after the day in the person's time zone (rule 0.2)", async () => {
      const person = await createAccount(app)
      await api(app, person).patch('/me/preferences').send({ timeZone: 'America/New_York' }).expect(200)
      // 20:00 of the 14th in New York is already the 15th in UTC.
      clockOf(app).set('2026-11-15T01:00:00.000Z')

      const response = await api(app, person).get('/me/export').expect(200)

      expect(response.body.exportedAt).toBe('2026-11-15T01:00:00.000Z')
      expect(response.headers['content-disposition']).toBe(`attachment; filename=account-export-${TEST_TODAY}.json`)
    })

    it('answers the empty sections of someone who has nothing yet, and needs a session', async () => {
      const person = await createAccount(app)

      const response = await api(app, person).get('/me/export').expect(200)

      expect(response.body.data).toMatchObject({
        identity: { profile: { id: person.id }, preferences: null },
        notes: { notes: [] },
      })
      await request(app.getHttpServer()).get('/me/export').expect(401)
    })
  })

  describe('POST /me/delete', () => {
    const rowsOf = async (table: PgTable, column: PgColumn, value: string): Promise<number> => {
      const [{ total }] = await app
        .get(DrizzleService)
        .db.select({ total: count() })
        .from(table)
        .where(eq(column, value))

      return total
    }

    const footprintOf = async (person: TestAccount): Promise<Record<string, number>> => ({
      users: await rowsOf(users, users.id, person.id),
      preferences: await rowsOf(userPreferences, userPreferences.userId, person.id),
      sessions: await rowsOf(refreshTokens, refreshTokens.userId, person.id),
      links: await rowsOf(userTokens, userTokens.userId, person.id),
      attempts: await rowsOf(signInAttempts, signInAttempts.email, person.email),
      notes: await rowsOf(notes, notes.userId, person.id),
    })

    it('asks the password again, and deletes nothing when it is wrong', async () => {
      const { person } = await personWithData()
      const before = await footprintOf(person)

      const wrong = await api(app, person).post('/me/delete').send({ password: 'not-my-password' }).expect(422)
      expect(wrong.body).toMatchObject({ statusCode: 422, code: 'USER.WRONG_PASSWORD' })
      await api(app, person).post('/me/delete').send({}).expect(400)
      await request(app.getHttpServer()).post('/me/delete').send({ password: person.password }).expect(401)

      expect(await footprintOf(person)).toEqual(before)
      expect(before).toMatchObject({ users: 1, preferences: 1, notes: 3 })
    })

    it('erases everything that is mine and nothing of anyone else', async () => {
      const { person } = await personWithData()
      const { person: other } = await personWithData()
      const othersFootprint = await footprintOf(other)
      const web = request.agent(app.getHttpServer())
      const signedIn = await web.post('/auth/sign-in').send({ email: person.email, password: person.password })
      expect(signedIn.status).toBe(200)
      // A wrong password leaves a line in the attempts (rule 1.4), which goes away with the account too.
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: person.email, password: 'wrong-password' })
        .expect(401)
      expect(await footprintOf(person)).toMatchObject({ users: 1, sessions: 2, attempts: 1, links: 1 })

      const deleted = await web
        .post('/me/delete')
        .auth(signedIn.body.accessToken, { type: 'bearer' })
        .send({ password: person.password })
        .expect(204)

      // The browser is told to drop the refresh cookie.
      const cookies = deleted.headers['set-cookie'] as unknown as string[] | undefined
      expect(cookies?.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`))).toMatch(
        new RegExp(`^${REFRESH_COOKIE}=;`),
      )
      expect(await footprintOf(person)).toEqual({
        users: 0,
        preferences: 0,
        sessions: 0,
        links: 0,
        attempts: 0,
        notes: 0,
      })

      // The other person is untouched.
      expect(await footprintOf(other)).toEqual(othersFootprint)
      expect((await api(app, other).get('/notes')).body.meta.totalItems).toBe(2)

      // Nothing opens with what the person still holds: the access token is valid until it expires (rule 1.3),
      // but there is nothing behind it and a write answers 401.
      await api(app, person).get('/me').expect(404)
      await api(app, person).get('/me/export').expect(404)
      expect((await api(app, person).get('/notes')).body.meta.totalItems).toBe(0)
      await api(app, person).post('/notes').send({ title: 'After the end' }).expect(401)
      await api(app, person)
        .patch('/me/preferences')
        .send({ appearance: { theme: 'light' } })
        .expect(401)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-auth-transport', 'token')
        .set('x-refresh-token', person.refreshToken)
        .expect(401)
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: person.email, password: person.password })
        .expect(401)

      // The e-mail is free again.
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ name: 'Back again', email: person.email, password: 'another-secret' })
        .expect(201)
    })
  })
})
