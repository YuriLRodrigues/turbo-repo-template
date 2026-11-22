import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { z } from 'zod'

import { roles } from '@core/auth/actor'

import type { AuthenticatedRequest } from './authenticated-request'
import { IS_PUBLIC_KEY } from './public.decorator'

const accessTokenPayloadSchema = z.object({ sub: z.uuid(), role: z.enum(roles), sid: z.uuid() })

/**
 * Global guard: verifies the bearer token and puts the actor and the session id on the request.
 *
 * It checks the signature and the expiry, nothing in the database: an access token stays valid until it expires
 * (15 minutes, rule 1.3), also after its session was revoked. That window is the price of not querying on every
 * request; what is revoked at once is the ability to get a new one.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const [scheme, token] = request.headers.authorization?.split(' ') ?? []
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException()

    const payload = await this.jwtService.verifyAsync<object>(token).catch(() => null)
    const parsed = accessTokenPayloadSchema.safeParse(payload)
    if (!parsed.success) throw new UnauthorizedException()

    request.actor = { id: parsed.data.sub, role: parsed.data.role }
    request.sessionId = parsed.data.sid

    return true
  }
}
