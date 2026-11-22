import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'

import type { AuthenticatedRequest } from './authenticated-request'

/** The id of the session the caller is using, taken from the verified access token. */
export const CurrentSessionId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const { sessionId } = context.switchToHttp().getRequest<AuthenticatedRequest>()

  // Only happens if a `@Public()` route asks for the session: a programming error, answered as 401.
  if (!sessionId) throw new UnauthorizedException()

  return sessionId
})
