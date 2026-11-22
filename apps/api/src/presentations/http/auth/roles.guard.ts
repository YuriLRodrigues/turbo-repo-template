import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { Role } from '@core/auth/actor'

import type { AuthenticatedRequest } from './authenticated-request'
import { ROLES_KEY } from './roles.decorator'

/** Global guard, runs after `AuthGuard`: enforces `@Roles(...)` when the route declares it. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true

    const { actor } = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (!actor || !required.includes(actor.role)) throw new ForbiddenException()

    return true
  }
}
