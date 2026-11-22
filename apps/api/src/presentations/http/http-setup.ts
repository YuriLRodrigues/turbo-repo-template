import type { NestExpressApplication } from '@nestjs/platform-express'

import { EnvService } from '@infra/env/env.service'

import { AUTH_TRANSPORT_HEADER, REFRESH_TOKEN_HEADER } from './auth/refresh-transport'

/**
 * What the HTTP server itself needs, beyond the guards, filter and pipe of `HttpModule`. `main.ts` and the e2e
 * suite call it, so both run the same server.
 *
 * - CORS with credentials for the configured origins only: the web app sends the refresh cookie from another
 *   origin, and a browser accepts `Access-Control-Allow-Credentials` only next to an explicit origin, never `*`.
 * - `trust proxy`: behind a reverse proxy the client IP (which the rate limit counts by) comes from
 *   `X-Forwarded-For`; trusting that header with no proxy in front would let anyone fake their IP.
 */
export function setupHttp(app: NestExpressApplication): void {
  const env = app.get(EnvService)

  app.enableCors({
    origin: env.get('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'x-request-id', AUTH_TRANSPORT_HEADER, REFRESH_TOKEN_HEADER],
    exposedHeaders: ['x-request-id', 'retry-after', 'content-disposition'],
    maxAge: 600,
  })

  const hops = env.get('TRUST_PROXY_HOPS')
  if (hops > 0) app.set('trust proxy', hops)
}
