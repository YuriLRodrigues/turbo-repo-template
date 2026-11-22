import { Injectable } from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'

import { EnvService } from '@infra/env/env.service'

import { readCookie } from './cookies'

/**
 * How the refresh token travels (docs/patterns/api/auth.md):
 *
 * - `cookie` (default, the web app): an httpOnly cookie that only the `/auth` routes receive. JavaScript never
 *   sees the token.
 * - `token` (native apps, which keep it in the device's secure storage): the client sends
 *   `x-auth-transport: token`, receives the refresh token in the response body and sends it back in the
 *   `x-refresh-token` header.
 */
export const AUTH_TRANSPORT_HEADER = 'x-auth-transport'
export const REFRESH_TOKEN_HEADER = 'x-refresh-token'
export const REFRESH_COOKIE = 'app.refresh_token'
export const REFRESH_COOKIE_PATH = '/auth'

export type AuthTransport = 'cookie' | 'token'

const headerOf = (request: Request, name: string): string | undefined => {
  const value = request.headers[name]

  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined
}

export function transportOf(request: Request): AuthTransport {
  return headerOf(request, AUTH_TRANSPORT_HEADER)?.toLowerCase() === 'token' ? 'token' : 'cookie'
}

/** The refresh token of the request, from the place its transport puts it. Never from the other one. */
export function refreshTokenOf(request: Request): string | undefined {
  return transportOf(request) === 'token'
    ? headerOf(request, REFRESH_TOKEN_HEADER)
    : readCookie(request.headers.cookie, REFRESH_COOKIE)
}

export const userAgentOf = (request: Request): string | undefined => headerOf(request, 'user-agent')

/** Writes and clears the refresh cookie with the attributes of this deployment. */
@Injectable()
export class RefreshCookie {
  private readonly options: CookieOptions

  constructor(env: EnvService) {
    const sameSite = env.get('AUTH_COOKIE_SAME_SITE')

    this.options = {
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      sameSite,
      // Browsers refuse `SameSite=None` without `Secure`.
      secure: env.get('NODE_ENV') === 'production' || sameSite === 'none',
    }
  }

  set(response: Response, refreshToken: string, expiresAt: Date): void {
    response.cookie(REFRESH_COOKIE, refreshToken, { ...this.options, expires: expiresAt })
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_COOKIE, this.options)
  }
}
