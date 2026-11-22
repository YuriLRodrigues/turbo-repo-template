import { randomUUID } from 'node:crypto'

import type { NextFunction, Request, Response } from 'express'

import type { AppLogger } from './app-logger'

export const REQUEST_ID_HEADER = 'x-request-id'

/** Swagger UI assets and the liveness probe would bury the lines that matter. */
const SKIPPED = [/^\/docs(\/|-json|$)/, /^\/health$/, /^\/favicon\.ico$/]

/** What the router and `AuthGuard` leave on the request. Express types `route` as `any`. */
type RequestView = { route?: { path?: unknown }; baseUrl?: string; actor?: { id: string; role: string } }

/** The route pattern (`/notes/:id`) keeps one line shape per endpoint; without a match, the raw path. */
function pathOf(request: Request): string {
  const { route, baseUrl } = request as unknown as RequestView
  const pattern = typeof route?.path === 'string' ? `${baseUrl ?? ''}${route.path}` : undefined

  return pattern ?? request.originalUrl.split('?')[0]
}

function actorOf(request: Request): string | undefined {
  const { actor } = request as unknown as RequestView

  return actor ? `${actor.role} ${actor.id.slice(0, 8)}` : undefined
}

/**
 * Writes one line per request when the response ends, and gives every request an id: the incoming
 * `x-request-id` (from a proxy or the frontend) or a new one, echoed back in the response header.
 */
export function createRequestLogMiddleware(logger: AppLogger) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now()
    const incoming = request.headers[REQUEST_ID_HEADER]
    const requestId = (typeof incoming === 'string' && incoming.trim().slice(0, 64)) || randomUUID()
    response.setHeader(REQUEST_ID_HEADER, requestId)

    const rawPath = request.originalUrl.split('?')[0]
    if (SKIPPED.some((pattern) => pattern.test(rawPath))) {
      next()

      return
    }

    let logged = false
    const finish = (aborted: boolean): void => {
      if (logged) return
      logged = true
      logger.request({
        time: new Date(),
        method: request.method,
        path: pathOf(request),
        status: response.statusCode,
        durationMs: performance.now() - startedAt,
        requestId,
        actor: actorOf(request),
        code: typeof response.locals.errorCode === 'string' ? response.locals.errorCode : undefined,
        aborted,
      })
    }

    response.once('finish', () => finish(false))
    response.once('close', () => finish(!response.writableFinished))

    next()
  }
}
