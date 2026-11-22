/*
 * The session of the browser, outside React (docs/patterns/web/auth.md):
 *
 * - the access token lives in memory only, never in storage: a page that is closed forgets it;
 * - the refresh token is an httpOnly cookie the API sets on its `/auth` routes: JavaScript never sees it;
 * - opening the app (or a 401) asks `POST /auth/refresh` for a new pair. The refresh token rotates on every use and a
 *   token used twice revokes the whole session (rule 1.3 of the API), so two tabs must never refresh at the same
 *   time with the same cookie. Every refresh runs inside one Web Lock (`navigator.locks`), shared by every tab of the
 *   origin; inside a tab, concurrent callers share the same promise.
 */

export type SessionTokens = { accessToken: string; expiresIn: number }

type SessionState = { accessToken: string | null }

export type ApiClientConfig = {
  /** Where the API answers: `http://localhost:3500`. */
  baseUrl: string
  /** Called when the session cannot be renewed (signed out elsewhere, expired, revoked): send the person to sign in. */
  onSessionExpired?: () => void
}

/** The name of the lock every tab takes before it refreshes. */
export const REFRESH_LOCK = 'app.auth.refresh'

/** The routes that must never trigger a refresh: they are how a session starts, ends or renews. */
const SESSION_ROUTES = ['/auth/sign-in', '/auth/sign-up', '/auth/refresh', '/auth/sign-out']

let config: ApiClientConfig = { baseUrl: '' }
const state: SessionState = { accessToken: null }
const listeners = new Set<() => void>()
let refreshing: Promise<boolean> | null = null

/** Call it once, before the first request (the root of the app). */
export const configureApiClient = (next: ApiClientConfig): void => {
  config = { ...next, baseUrl: next.baseUrl.replace(/\/+$/, '') }
}

export const getApiConfig = (): ApiClientConfig => config

export const getAccessToken = (): string | null => state.accessToken

/** Whether the tab holds an access token right now (it may still be expired: the next request renews it). */
export const hasSession = (): boolean => state.accessToken !== null

const notify = (): void => listeners.forEach((listener) => listener())

/** Keeps the token of a new session: what `signIn` and `refreshSession` answer. */
export const setSession = (tokens: SessionTokens): void => {
  state.accessToken = tokens.accessToken
  notify()
}

export const clearSession = (): void => {
  if (state.accessToken === null) return
  state.accessToken = null
  notify()
}

/** For `useSyncExternalStore`: re-render when the session starts or ends. */
export const subscribeSession = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const isSessionRoute = (path: string): boolean => SESSION_ROUTES.some((route) => path.startsWith(route))

/** One refresh at a time across every tab; a browser without Web Locks (very old) refreshes without it. */
const withRefreshLock = <T>(task: () => Promise<T>): Promise<T> => {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks

  return locks ? locks.request(REFRESH_LOCK, { mode: 'exclusive' }, task) : task()
}

/** `POST /auth/refresh` with the cookie. True when a new access token was stored. */
const requestRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${config.baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'application/json' },
    })
    if (!response.ok) {
      clearSession()

      return false
    }
    setSession((await response.json()) as SessionTokens)

    return true
  } catch {
    // Offline or the API is down: the session is not known to be dead, so nobody is sent away.
    return false
  }
}

/**
 * Renews the access token. Concurrent callers in this tab share one request; other tabs wait for the lock and then
 * refresh with the cookie the previous refresh left, so no refresh token is ever presented twice.
 */
export const refreshAccessToken = (): Promise<boolean> => {
  refreshing ??= withRefreshLock(requestRefresh).finally(() => {
    refreshing = null
  })

  return refreshing
}

/**
 * On opening the app: turns the refresh cookie (if there is one) into an access token. True when the person is
 * signed in. Never calls `onSessionExpired`: not having a session yet is not an expiry.
 */
export const restoreSession = async (): Promise<boolean> => (hasSession() ? true : refreshAccessToken())

/** The session is over and cannot be renewed: forget it and let the app react. */
export const expireSession = (): void => {
  clearSession()
  config.onSessionExpired?.()
}
