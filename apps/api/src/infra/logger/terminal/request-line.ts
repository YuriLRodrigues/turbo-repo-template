import { padEndVisible, padStartVisible, type Style } from './ansi'
import type { RenderContext } from './banner'
import type { Palette } from './palette'
import { formatClock, formatDuration } from './time-format'

/** One finished request, assembled by the middleware when the response ends. */
export type RequestEntry = {
  time: Date
  method: string
  /** The route pattern (`/notes/:id`) when one matched; the raw path otherwise. */
  path: string
  status: number
  durationMs: number
  requestId?: string
  /** `USER 1a2b3c4d` */
  actor?: string
  /** The error code of a failed request (`NOTE.NOT_FOUND`). */
  code?: string
  /** The client closed the connection before the response ended. */
  aborted?: boolean
}

export const SLOW_REQUEST_MS = 1000

const PATH_WIDTH = 28

function statusStyle(status: number, palette: Palette): Style {
  if (status >= 500) return palette.status.s5xx
  if (status >= 400) return palette.status.s4xx
  if (status >= 300) return palette.status.s3xx

  return palette.status.s2xx
}

/**
 * `14:32:07  POST    /notes                        201    12ms  USER 1a2b3c4d · rid 9f8e7d6c`
 *
 * Method and status carry the color; a slow request has its duration highlighted.
 */
export function renderRequestLine(entry: RequestEntry, { painter, palette }: RenderContext): string {
  const time = painter.paint(formatClock(entry.time), palette.muted)
  const method = painter.paint(entry.method.padEnd(7), palette.methods[entry.method] ?? palette.fg)
  const path = padEndVisible(painter.paint(entry.path, palette.fg), PATH_WIDTH)
  const status = entry.aborted
    ? painter.paint('abort', palette.warn)
    : painter.paint(String(entry.status).padEnd(5), statusStyle(entry.status, palette))
  const duration = padStartVisible(
    painter.paint(formatDuration(entry.durationMs), entry.durationMs >= SLOW_REQUEST_MS ? palette.slow : palette.muted),
    6,
  )
  const code = entry.code ? `  ${painter.paint(entry.code, statusStyle(entry.status, palette))}` : ''
  const tail = [entry.actor, entry.requestId && `rid ${entry.requestId.slice(0, 8)}`].filter(Boolean).join(' · ')

  return ` ${time}  ${method} ${path} ${status} ${duration}${code}${tail ? `  ${painter.paint(tail, palette.muted)}` : ''}`
}
