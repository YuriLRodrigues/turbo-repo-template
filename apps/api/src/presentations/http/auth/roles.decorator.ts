import { SetMetadata } from '@nestjs/common'

import type { Role } from '@core/auth/actor'

export const ROLES_KEY = 'auth:roles'

/** Restricts a route (or a whole controller) to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
