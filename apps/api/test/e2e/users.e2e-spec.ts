import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { api, clockOf, createAccount, createTestApp, type TestApp } from './create-test-app'

describe('users (e2e)', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /users is forbidden for a regular user', async () => {
    const user = await createAccount(app)

    const response = await api(app, user).get('/users').expect(403)

    expect(response.body).toMatchObject({ statusCode: 403, code: 'HTTP.FORBIDDEN' })
  })

  it('GET /users lists accounts for an admin, newest first', async () => {
    // Every spec shares the database and creates its accounts "today": this one is created well after them.
    clockOf(app).set('2031-01-01T12:00:00Z')
    const admin = await createAccount(app, 'ADMIN')

    const response = await api(app, admin).get('/users').query({ limit: 1 }).expect(200)

    expect(response.body.results).toEqual([expect.objectContaining({ id: admin.id, role: 'ADMIN' })])
    expect(response.body.results[0]).not.toHaveProperty('passwordHash')
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1 })
  })
})
