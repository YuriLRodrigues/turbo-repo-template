import { Module, ValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core'
import { seconds, ThrottlerModule } from '@nestjs/throttler'

import { CryptographyModule } from '@infra/cryptography/cryptography.module'
import { EnvService } from '@infra/env/env.service'

import { AuthGuard } from './auth/auth.guard'
import { PublicThrottlerGuard } from './auth/public-throttler.guard'
import { RolesGuard } from './auth/roles.guard'
import { HealthController } from './controllers/health/health.controller'
import { IdentityHttpModule } from './controllers/identity/identity-http.module'
import { NotesHttpModule } from './controllers/notes/notes-http.module'
import { HttpErrorFilter } from './errors/http-error.filter'

/**
 * The HTTP edge. Guards, filter and pipe are registered here (not in `main.ts`) so the e2e app gets exactly the
 * same behaviour. Guards run in this order: PublicThrottlerGuard, AuthGuard, RolesGuard.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        // Unnamed on purpose: it is the `default` throttler, the one a bare `@SkipThrottle()` refers to.
        throttlers: [{ limit: env.get('PUBLIC_RATE_LIMIT'), ttl: seconds(env.get('PUBLIC_RATE_WINDOW_SECONDS')) }],
      }),
    }),
    CryptographyModule,
    // One module per bounded context.
    IdentityHttpModule,
    NotesHttpModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: PublicThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
  ],
})
export class HttpModule {}
