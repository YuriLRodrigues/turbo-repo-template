import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './api-error'
import { type CustomFetchResponse, customFetch } from './custom-fetch'
import {
  clearSession,
  configureApiClient,
  getAccessToken,
  REFRESH_LOCK,
  refreshAccessToken,
  restoreSession,
  setSession,
} from './session'
import { unwrap } from './unwrap'

const API = 'http://api.test'

type Call = { url: string; init: RequestInit }

/** A fake API: answers by route, records every call. */
const fakeApi = (routes: Record<string, (call: Call) => Response | Promise<Response>>) => {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const call = { url, init }
      calls.push(call)
      const path = url.replace(API, '').split('?')[0]
      const route = routes[`${init.method ?? 'GET'} ${path}`]
      if (!route) throw new TypeError('Failed to fetch')

      return route(call)
    }),
  )

  return calls
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const authorizationOf = (call: Call) => new Headers(call.init.headers).get('authorization')

describe('customFetch', () => {
  const onSessionExpired = vi.fn()

  beforeEach(() => {
    configureApiClient({ baseUrl: `${API}/`, onSessionExpired })
    clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('calls the base URL with the access token and the cookie, and returns status, data and headers', async () => {
    setSession({ accessToken: 'token-1', expiresIn: 900 })
    const calls = fakeApi({ 'GET /notes': () => json({ results: [] }) })

    const response = await customFetch<CustomFetchResponse>('/notes?page=2', { method: 'GET' })

    expect(response).toMatchObject({ status: 200, data: { results: [] } })
    expect(calls[0].url).toBe(`${API}/notes?page=2`)
    expect(calls[0].init.credentials).toBe('include')
    expect(authorizationOf(calls[0])).toBe('Bearer token-1')
  })

  it('renews the session on a 401 and repeats the request once', async () => {
    setSession({ accessToken: 'expired', expiresIn: 900 })
    const calls = fakeApi({
      'GET /me': (call) => (authorizationOf(call) === 'Bearer fresh' ? json({ id: 'me' }) : json({}, 401)),
      'POST /auth/refresh': () => json({ accessToken: 'fresh', expiresIn: 900 }),
    })

    const response = await customFetch<CustomFetchResponse>('/me', { method: 'GET' })

    expect(response).toMatchObject({ status: 200, data: { id: 'me' } })
    expect(calls.map((call) => `${call.init.method} ${call.url.replace(API, '')}`)).toEqual([
      'GET /me',
      'POST /auth/refresh',
      'GET /me',
    ])
    expect(getAccessToken()).toBe('fresh')
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('refreshes once for many requests that fail together', async () => {
    setSession({ accessToken: 'expired', expiresIn: 900 })
    const calls = fakeApi({
      'GET /notes': (call) => (authorizationOf(call) === 'Bearer fresh' ? json({ results: [] }) : json({}, 401)),
      'POST /auth/refresh': async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))

        return json({ accessToken: 'fresh', expiresIn: 900 })
      },
    })

    const responses = await Promise.all([1, 2, 3].map(() => customFetch<CustomFetchResponse>('/notes')))

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(calls.filter((call) => call.url.endsWith('/auth/refresh'))).toHaveLength(1)
  })

  it('ends the session when it cannot be renewed', async () => {
    setSession({ accessToken: 'expired', expiresIn: 900 })
    fakeApi({
      'GET /me': () => json({ statusCode: 401, code: 'HTTP.UNAUTHORIZED', message: 'Unauthorized' }, 401),
      'POST /auth/refresh': () => json({ statusCode: 401, code: 'AUTH.REFRESH_TOKEN_REUSED', message: 'no' }, 401),
    })

    const response = await customFetch<CustomFetchResponse>('/me')

    expect(response.status).toBe(401)
    expect(getAccessToken()).toBeNull()
    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('never refreshes for the routes that start or renew a session', async () => {
    const calls = fakeApi({ 'POST /auth/sign-in': () => json({ code: 'AUTH.INVALID_CREDENTIALS' }, 401) })

    const response = await customFetch<CustomFetchResponse>('/auth/sign-in', { method: 'POST' })

    expect(response.status).toBe(401)
    expect(calls).toHaveLength(1)
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('answers 503 API.UNREACHABLE instead of throwing when the API cannot be reached', async () => {
    fakeApi({})

    const response = await customFetch<CustomFetchResponse>('/health')

    expect(response).toMatchObject({ status: 503, data: { code: 'API.UNREACHABLE' } })
  })

  it('parses an empty body as undefined', async () => {
    fakeApi({ 'DELETE /notes/1': () => new Response(null, { status: 204 }) })

    expect((await customFetch<CustomFetchResponse>('/notes/1', { method: 'DELETE' })).data).toBeUndefined()
  })
})

describe('the refresh across tabs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
  })

  it('takes the shared Web Lock, so two tabs never present the same refresh token', async () => {
    const request = vi.fn((_name: string, _options: unknown, task: () => Promise<unknown>) => task())
    vi.stubGlobal('navigator', { locks: { request } })
    configureApiClient({ baseUrl: API })
    fakeApi({ 'POST /auth/refresh': () => json({ accessToken: 'fresh', expiresIn: 900 }) })

    expect(await refreshAccessToken()).toBe(true)
    expect(request).toHaveBeenCalledWith(REFRESH_LOCK, { mode: 'exclusive' }, expect.any(Function))
  })

  it('restores a session from the cookie on opening the app, and says so when there is none', async () => {
    configureApiClient({ baseUrl: API })
    fakeApi({ 'POST /auth/refresh': () => json({ statusCode: 401, code: 'AUTH.REFRESH_TOKEN_INVALID' }, 401) })

    expect(await restoreSession()).toBe(false)

    fakeApi({ 'POST /auth/refresh': () => json({ accessToken: 'restored', expiresIn: 900 }) })
    expect(await restoreSession()).toBe(true)
    expect(getAccessToken()).toBe('restored')
  })
})

describe('unwrap', () => {
  it('answers the data of a 2xx and throws an ApiError with the code otherwise', async () => {
    await expect(unwrap(Promise.resolve({ status: 200 as const, data: { id: '1' } }))).resolves.toEqual({ id: '1' })

    const failure = unwrap(
      Promise.resolve({ status: 404 as const, data: { statusCode: 404, code: 'NOTE.NOT_FOUND', message: 'Gone.' } }),
    )
    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ code: 'NOTE.NOT_FOUND', statusCode: 404, message: 'Gone.' })
  })

  it('gives an unexpected body the generic code', async () => {
    await expect(unwrap(Promise.resolve({ status: 502, data: '<html>' }))).rejects.toMatchObject({
      code: 'HTTP.UNEXPECTED_RESPONSE',
    })
  })
})
