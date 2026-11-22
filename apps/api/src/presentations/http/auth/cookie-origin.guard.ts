import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import type { Request } from 'express'

import { EnvService } from '@infra/env/env.service'

import { transportOf } from './refresh-transport'

/**
 * For the routes that read or write the refresh cookie (sign-in, refresh, sign-out). A browser sends that cookie
 * by itself, so another site could make the browser call these routes: when the request says where it comes from
 * (`Origin`), it must be one of the configured origins (`CORS_ORIGINS`), or the answer is 403.
 *
 * A request without `Origin` is not a cross-site browser request (browsers always send it on a cross-origin POST),
 * and the `token` transport carries no cookie: both pass.
 */
@Injectable()
export class CookieOriginGuard implements CanActivate {
  private readonly allowed: ReadonlySet<string>

  constructor(env: EnvService) {
    this.allowed = new Set(env.get('CORS_ORIGINS'))
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (transportOf(request) === 'token') return true

    const origin = request.headers.origin
    if (origin && !this.allowed.has(origin.replace(/\/+$/, ''))) {
      throw new ForbiddenException('This origin cannot use the session cookie.')
    }

    return true
  }
}
