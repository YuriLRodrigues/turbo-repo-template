import { API_UNREACHABLE } from './api-error'
import { expireSession, getAccessToken, getApiConfig, isSessionRoute, refreshAccessToken } from './session'

/** Every generated function resolves to this, whatever the status: an HTTP error is a value, not an exception. */
export type CustomFetchResponse<TData = unknown> = {
  status: number
  data: TData
  headers: Headers
}

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) return undefined

  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const send = async (path: string, init: RequestInit): Promise<Response> => {
  const headers = new Headers(init.headers)
  if (!headers.has('accept')) headers.set('accept', 'application/json')
  const token = getAccessToken()
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`)

  // `include`: the refresh cookie travels to the `/auth` routes of the API, which is another origin in development.
  return fetch(`${getApiConfig().baseUrl}${path}`, { credentials: 'include', ...init, headers })
}

/**
 * The transport of the generated client (`src/gen/*`). Orval builds the path, the query string and the
 * `RequestInit`; this adds what every call needs:
 *
 * - the base URL (`configureApiClient`), the access token and the refresh cookie;
 * - refresh-and-retry: a 401 on a private route renews the session once (`refreshAccessToken`, serialized across
 *   tabs) and repeats the request; when the session cannot be renewed, `onSessionExpired` runs;
 * - JSON parsing, and one return shape for every status.
 *
 * It never throws: when the API cannot be reached the result is a 503 with the API's own error shape
 * (`API.UNREACHABLE`), so screens handle it like any other error.
 */
export const customFetch = async <TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> => {
  try {
    let response = await send(path, init)

    if (response.status === 401 && !isSessionRoute(path)) {
      if (await refreshAccessToken()) response = await send(path, init)
      if (response.status === 401) expireSession()
    }

    return { status: response.status, data: await parseBody(response), headers: response.headers } as TResponse
  } catch {
    return { status: API_UNREACHABLE.statusCode, data: API_UNREACHABLE, headers: new Headers() } as TResponse
  }
}
