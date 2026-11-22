import type { Request } from 'express'

import type { Actor } from '@core/auth/actor'

/** Set by `AuthGuard` on every non-public route. */
export type AuthenticatedRequest = Request & {
  actor?: Actor
  /** The session (refresh token family) the access token was issued in. */
  sessionId?: string
}
