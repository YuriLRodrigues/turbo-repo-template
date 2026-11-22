import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { MINUTE, TEST_NOW } from '../time/fake-clock'
import { api, clockOf, createAccount, createTestApp, type TestAccount, type TestApp } from './create-test-app'

type Json = Record<string, unknown>

describe('notes (e2e, rule 2)', () => {
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

  const write = async (account: TestAccount, body: Json = { title: 'Groceries' }): Promise<Json> =>
    (await api(app, account).post('/notes').send(body).expect(201)).body as Json

  const titlesOf = async (account: TestAccount, query = ''): Promise<string[]> => {
    const response = await api(app, account).get(`/notes${query}`).expect(200)

    return (response.body.results as Json[]).map((note) => String(note.title))
  }

  describe('POST /notes', () => {
    it('writes a note and answers it', async () => {
      const account = await createAccount(app)

      const response = await api(app, account)
        .post('/notes')
        .send({ title: '  Weekly   plan ', body: ' Monday\nTuesday ' })
        .expect(201)

      expect(response.body).toEqual({
        id: expect.any(String),
        title: 'Weekly plan',
        body: 'Monday\nTuesday',
        pinned: false,
        archivedAt: null,
        createdAt: TEST_NOW.toISOString(),
        updatedAt: TEST_NOW.toISOString(),
      })
    })

    it.each([
      [{ title: '   ' }, 'NOTE.INVALID_TITLE'],
      [{ title: 'a'.repeat(121) }, 'NOTE.INVALID_TITLE'],
      [{ title: 'Long', body: 'a'.repeat(10_001) }, 'NOTE.INVALID_BODY'],
    ])('answers 422 for %#', async (body, code) => {
      const account = await createAccount(app)

      const response = await api(app, account).post('/notes').send(body).expect(422)

      expect(response.body).toMatchObject({ statusCode: 422, code })
    })

    it('answers 400 for a body of the wrong shape, and 401 without a session', async () => {
      const account = await createAccount(app)

      const response = await api(app, account).post('/notes').send({ title: 3, ownerId: randomUUID() }).expect(400)

      expect(response.body.code).toBe('VALIDATION.FAILED')
      expect(response.body.details.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('title'), expect.stringContaining('ownerId')]),
      )
      await request(app.getHttpServer()).post('/notes').send({ title: 'No session' }).expect(401)
    })
  })

  describe('GET /notes', () => {
    it('lists my notes, pinned first and then the most recently changed (rule 2.3)', async () => {
      const account = await createAccount(app)
      await write(account, { title: 'First' })
      clockOf(app).advance(MINUTE)
      await write(account, { title: 'Second' })
      clockOf(app).advance(MINUTE)
      await write(account, { title: 'Pinned', pinned: true })
      clockOf(app).advance(MINUTE)
      await write(account, { title: 'Third' })

      const response = await api(app, account).get('/notes?limit=3').expect(200)

      expect(response.body.results.map((note: Json) => note.title)).toEqual(['Pinned', 'Third', 'Second'])
      expect(response.body.meta).toEqual({ page: 1, limit: 3, totalItems: 4, totalPages: 2 })
    })

    it('searches the title and the body, and keeps the archive apart (rule 2.2)', async () => {
      const account = await createAccount(app)
      await write(account, { title: 'Groceries', body: 'Milk and BREAD' })
      await write(account, { title: '100%_done' })
      const archived = await write(account, { title: 'Bread recipe' })
      await api(app, account)
        .patch(`/notes/${String(archived.id)}/archive`)
        .expect(200)

      expect(await titlesOf(account, '?search=bread')).toEqual(['Groceries'])
      expect(await titlesOf(account, '?search=bread&archived=true')).toEqual(['Bread recipe'])
      // `%` and `_` are matched literally.
      expect(await titlesOf(account, `?search=${encodeURIComponent('%_')}`)).toEqual(['100%_done'])
    })

    it("never lists someone else's notes (rule 0.4), and validates the query", async () => {
      const jane = await createAccount(app)
      const john = await createAccount(app)
      await write(john, { title: 'Of John' })

      expect(await titlesOf(jane)).toEqual([])
      await api(app, jane).get('/notes?archived=maybe').expect(400)
      await api(app, jane).get('/notes?limit=101').expect(400)
    })
  })

  describe('GET, PATCH and DELETE /notes/:id', () => {
    it('reads, changes only what was sent and deletes', async () => {
      const account = await createAccount(app)
      const note = await write(account, { title: 'Groceries', body: 'Milk' })
      clockOf(app).advance(MINUTE)

      const changed = await api(app, account)
        .patch(`/notes/${String(note.id)}`)
        .send({ pinned: true })
        .expect(200)
      expect(changed.body).toMatchObject({
        title: 'Groceries',
        body: 'Milk',
        pinned: true,
        updatedAt: new Date(TEST_NOW.getTime() + MINUTE).toISOString(),
      })

      const cleared = await api(app, account)
        .patch(`/notes/${String(note.id)}`)
        .send({ title: 'Shopping', body: null })
        .expect(200)
      expect(cleared.body).toMatchObject({ title: 'Shopping', body: null })
      expect(
        (
          await api(app, account)
            .get(`/notes/${String(note.id)}`)
            .expect(200)
        ).body,
      ).toEqual(cleared.body)

      await api(app, account)
        .delete(`/notes/${String(note.id)}`)
        .expect(204)
      const gone = await api(app, account)
        .get(`/notes/${String(note.id)}`)
        .expect(404)
      expect(gone.body).toMatchObject({ statusCode: 404, code: 'NOTE.NOT_FOUND' })
    })

    it('makes an archived note read-only until it is unarchived (rule 2.2)', async () => {
      const account = await createAccount(app)
      const note = await write(account, { title: 'Idea', pinned: true })

      const archived = await api(app, account)
        .patch(`/notes/${String(note.id)}/archive`)
        .expect(200)
      expect(archived.body).toMatchObject({ pinned: false, archivedAt: TEST_NOW.toISOString() })
      await api(app, account)
        .patch(`/notes/${String(note.id)}/archive`)
        .expect(200)

      const refused = await api(app, account)
        .patch(`/notes/${String(note.id)}`)
        .send({ title: 'New' })
        .expect(409)
      expect(refused.body).toMatchObject({ statusCode: 409, code: 'NOTE.ARCHIVED' })

      const back = await api(app, account)
        .patch(`/notes/${String(note.id)}/unarchive`)
        .expect(200)
      expect(back.body).toMatchObject({ archivedAt: null })
      await api(app, account)
        .patch(`/notes/${String(note.id)}`)
        .send({ title: 'New' })
        .expect(200)
    })

    it("answers 404 for someone else's note and 400 for an id that is not a UUID (rule 0.4)", async () => {
      const jane = await createAccount(app)
      const john = await createAccount(app)
      const note = await write(john)
      const path = `/notes/${String(note.id)}`

      for (const response of [
        await api(app, jane).get(path),
        await api(app, jane).patch(path).send({ title: 'Mine now' }),
        await api(app, jane).patch(`${path}/archive`),
        await api(app, jane).patch(`${path}/unarchive`),
        await api(app, jane).delete(path),
      ]) {
        expect(response.status).toBe(404)
        expect(response.body.code).toBe('NOTE.NOT_FOUND')
      }
      expect((await api(app, john).get(path).expect(200)).body.title).toBe('Groceries')
      await api(app, jane).get('/notes/not-a-uuid').expect(400)
    })
  })
})
