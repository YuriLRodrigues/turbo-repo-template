import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'

import type { AuthenticatedRequest } from './authenticated-request'

/** The authenticated actor, taken from the verified token. */
export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext): Actor => {
  const { actor } = context.switchToHttp().getRequest<AuthenticatedRequest>()

  // Only happens if a `@Public()` route asks for the actor: a programming error, answered as 401.
  if (!actor) throw new UnauthorizedException()

  return actor
})
