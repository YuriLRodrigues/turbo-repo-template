import { type ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

import { IS_PUBLIC_KEY } from './public.decorator'

/**
 * Global guard, runs first: limits how often one IP can call each route that needs no token (sign-up, sign-in,
 * refresh, the e-mail links). Those are the routes anyone on the internet can hammer. The limit is per IP and per
 * route, in the memory of each instance: a coarse brake. The limit that must hold across instances, the wrong
 * passwords of rule 1.4, lives in the database.
 *
 * Authenticated routes are not limited here. `@SkipThrottle()` opens a public route (the health check).
 */
@Injectable()
export class PublicThrottlerGuard extends ThrottlerGuard {
  protected override shouldSkip(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    return Promise.resolve(!isPublic)
  }
}
