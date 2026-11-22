import { padEndVisible, padStartVisible } from './ansi'
import type { RenderContext } from './banner'
import { formatDuration } from './time-format'

export type BootCheckStatus = 'ok' | 'warn' | 'fail' | 'skip'

export type BootCheck = {
  status: BootCheckStatus
  /** Short name of the step: `env`, `Postgres`, `Swagger`. */
  label: string
  detail?: string
  durationMs?: number
  /** Printed under a failure. */
  hint?: string
}

const LABEL_WIDTH = 9
const DETAIL_WIDTH = 34

/** One checklist line: `✔ Postgres  connected ……… 23ms`, `✖ Postgres  reason` + hint. */
export function renderCheck(check: BootCheck, { painter, palette }: RenderContext): string[] {
  const label = check.label.padEnd(LABEL_WIDTH)
  const duration = check.durationMs === undefined ? '' : painter.paint(formatDuration(check.durationMs), palette.muted)
  const timed = (detail: string) =>
    duration ? `${padEndVisible(detail, DETAIL_WIDTH)} ${padStartVisible(duration, 6)}` : detail

  switch (check.status) {
    case 'fail': {
      const lines = [
        `   ${painter.paint(`✖ ${label}`, palette.error)} ${timed(painter.paint(check.detail ?? 'failed', palette.error))}`,
      ]
      if (check.hint) lines.push(`${' '.repeat(15)}${painter.paint('hint ›', palette.hint)} ${check.hint}`)

      return lines
    }
    case 'warn':
      return [
        `   ${painter.paint(`⚠ ${label}`, palette.warn)} ${timed(painter.paint(check.detail ?? '', palette.warn))}`,
      ]
    case 'skip':
      return [`   ${painter.paint(`– ${label} ${check.detail ?? ''}`, palette.muted)}`]
    default:
      return [`   ${painter.paint('✔', palette.ok)} ${painter.paint(label, palette.fg)} ${timed(check.detail ?? '')}`]
  }
}

export type ReadyInfo = {
  elapsedMs: number
  url: string
  /** `/docs` */
  docsPath?: string
  checks: readonly BootCheck[]
}

/** The line that closes the boot: time, URL, docs and one ✔/✖ per dependency that was checked. */
export function renderReady(info: ReadyInfo, { painter, palette }: RenderContext): string {
  const dot = painter.paint(' · ', palette.muted)
  const failed = info.checks.filter((check) => check.status === 'fail').length
  const head = failed
    ? painter.paint(`⚠ ready in ${formatDuration(info.elapsedMs)} with ${failed} failed check(s)`, palette.warn)
    : `${painter.paint('✔', palette.ok)} ${painter.paint(`ready in ${formatDuration(info.elapsedMs)}`, palette.strong)}`

  const parts = [head, painter.paint(info.url, palette.brand)]
  if (info.docsPath) parts.push(painter.paint(`docs ${info.docsPath}`, palette.fg))

  return ` ${parts.join(dot)}`
}

export type BootFailure = {
  /** First line is the headline; the others are listed under it. */
  message: string
  hint?: string
  stack?: readonly string[]
}

/** Explains the boot errors people hit most. */
export function explainBootError(message: string): string | undefined {
  const dependency = /argument (.+?) at index \[\d+\] is available in the (\w+) context/.exec(message)
  if (dependency) return `import the module that exports ${dependency[1]} into ${dependency[2]}`

  const port = /EADDRINUSE.*?:(\d+)/.exec(message)
  if (port) return `port ${port[1]} is already in use: stop the other process or change PORT`

  if (/Invalid environment variables/i.test(message)) return 'compare your .env with .env.example'
  if (/migrations to the embedded database/i.test(message)) {
    return 'that folder only holds local development data (apps/api/.pglite/data by default): it is safe to delete'
  }
  if (/ECONNREFUSED|ENOTFOUND|password authentication failed/i.test(message)) {
    return 'is the database in DATABASE_URL up? In development, remove DATABASE_URL to run on the embedded PGlite'
  }

  return undefined
}

/** The red block of a boot that failed: the whole message, a hint and the stack. */
export function renderBootFailure(failure: BootFailure, { painter, palette }: RenderContext): string[] {
  const [first, ...rest] = failure.message.split('\n')
  const badge = painter.enabled ? painter.paint(' BOOT ', palette.errorBadge) : '[BOOT]'
  const lines = [
    ` ${badge} ${painter.paint(`✖ ${first}`, palette.error)}`,
    ...rest.filter((line) => line.trim()).map((line) => `     ${painter.paint(line.trim(), palette.error)}`),
  ]
  if (failure.hint) lines.push(`     ${painter.paint('hint ›', palette.hint)} ${failure.hint}`)
  for (const frame of failure.stack ?? []) lines.push(`     ${painter.paint(frame, palette.muted)}`)
  lines.push(`   ${painter.paint('✖ process exited (code 1)', palette.error)}`)

  return lines
}
