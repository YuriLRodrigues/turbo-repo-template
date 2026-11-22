import type { LoggerService } from '@nestjs/common'

import { LOG_LEVEL_RANK, type LoggerConfig, type LogLevel, resolveLoggerConfig } from './logger-config'
import { type ColorLevel, createPainter, type Style } from './terminal/ansi'
import { type Background, detectBackground } from './terminal/background'
import { type BannerInfo, renderBanner, type RenderContext } from './terminal/banner'
import {
  type BootCheck,
  explainBootError,
  type ReadyInfo,
  renderBootFailure,
  renderCheck,
  renderReady,
} from './terminal/boot'
import { detectColorLevel } from './terminal/color-support'
import { parseStack, renderErrorBlock, toErrorDetail } from './terminal/error-block'
import { paletteFor } from './terminal/palette'
import { renderRequestLine, type RequestEntry } from './terminal/request-line'
import { renderRouteTable, type RouteInfo } from './terminal/route-table'
import { formatClock } from './terminal/time-format'

export type AppLoggerOptions = {
  config?: LoggerConfig
  colorLevel?: ColorLevel
  background?: Background
  columns?: number
  /** Where lines go. Tests pass a collector; the default is stdout. */
  write?: (line: string) => void
  now?: () => Date
}

/** Nest prints one line per provider and per route at boot; the route table replaces them. */
const NOISY_CONTEXTS = new Set(['InstanceLoader', 'RoutesResolver', 'RouterExplorer', 'NestFactory', 'NestApplication'])

const LEVEL_LABEL: Record<LogLevel, string> = { debug: 'DEBUG', info: 'INFO', warn: 'WARN', error: 'ERROR' }

const looksLikeStack = (value: unknown): boolean => typeof value === 'string' && /\n\s+at /.test(value)

/**
 * The application's only logger. It is Nest's `LoggerService` (so `new Logger(Context)` anywhere ends up here) and
 * it also draws the boot: banner, checklist, route table and the "ready" line.
 *
 * `pretty` is for a person reading a terminal; `json` writes one object per line for a log collector.
 */
export class AppLogger implements LoggerService {
  readonly config: LoggerConfig
  private readonly colorLevel: ColorLevel
  private readonly columns?: number
  private readonly write: (line: string) => void
  private readonly now: () => Date
  private background: Background
  private readonly checks: BootCheck[] = []

  constructor(options: AppLoggerOptions = {}) {
    this.config = options.config ?? resolveLoggerConfig(process.env)
    this.colorLevel = options.colorLevel ?? detectColorLevel()
    this.background = options.background ?? 'dark'
    this.columns = options.columns ?? (process.stdout.isTTY ? process.stdout.columns : undefined)
    this.write = options.write ?? ((line) => void process.stdout.write(`${line}\n`))
    this.now = options.now ?? (() => new Date())
  }

  private get pretty(): boolean {
    return this.config.format === 'pretty'
  }

  private get ctx(): RenderContext {
    return { painter: createPainter(this.colorLevel), palette: paletteFor(this.background), columns: this.columns }
  }

  private enabled(level: LogLevel): boolean {
    return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[this.config.level]
  }

  private json(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
    this.write(JSON.stringify({ time: this.now().toISOString(), level, message, ...fields }))
  }

  /** Asks the terminal whether it is dark or light. Call it once, before the banner. */
  async detectBackground(): Promise<void> {
    if (this.pretty && this.colorLevel !== 'none') this.background = await detectBackground()
  }

  // ── Boot ───────────────────────────────────────────────────────────────────────────────────────────────────

  banner(info: Omit<BannerInfo, 'brand'>): void {
    if (!this.pretty || !this.config.banner) return
    this.write(['', ...renderBanner({ ...info, brand: this.config.brand }, this.ctx), ''].join('\n'))
  }

  check(check: BootCheck): void {
    this.checks.push(check)
    if (this.pretty) {
      this.write(renderCheck(check, this.ctx).join('\n'))

      return
    }
    const level: LogLevel = check.status === 'fail' ? 'error' : check.status === 'warn' ? 'warn' : 'info'
    this.json(level, 'boot check', { check: check.label, status: check.status, detail: check.detail })
  }

  routes(routes: readonly RouteInfo[]): void {
    if (this.pretty) this.write(['', ...renderRouteTable(routes, this.ctx), ''].join('\n'))
  }

  ready(info: Omit<ReadyInfo, 'checks'>): void {
    if (this.pretty) {
      this.write(`${renderReady({ ...info, checks: this.checks }, this.ctx)}\n`)

      return
    }
    this.json('info', 'ready', { url: info.url, elapsedMs: Math.round(info.elapsedMs) })
  }

  /** The boot could not finish: prints why (with a hint for the usual causes). The caller exits. */
  bootFailed(error: unknown): void {
    const detail = toErrorDetail(error)
    if (!this.pretty) {
      this.json('error', `boot failed: ${detail.message}`, { error: detail.name, stack: detail.stack })

      return
    }
    const stack = parseStack(detail.stack)
      .slice(0, 6)
      .map((frame) => frame.text)
    this.write(
      [
        '',
        ...renderBootFailure({ message: detail.message, hint: explainBootError(detail.message), stack }, this.ctx),
      ].join('\n'),
    )
  }

  // ── Requests ───────────────────────────────────────────────────────────────────────────────────────────────

  request(entry: RequestEntry): void {
    if (!this.config.requests) return
    const level: LogLevel = entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'info'
    if (!this.enabled(level)) return
    if (this.pretty) {
      this.write(renderRequestLine(entry, this.ctx))

      return
    }
    this.json(level, 'request', {
      method: entry.method,
      path: entry.path,
      status: entry.status,
      durationMs: Math.round(entry.durationMs),
      code: entry.code,
      requestId: entry.requestId,
      actor: entry.actor,
      aborted: entry.aborted || undefined,
    })
  }

  // ── Nest LoggerService ─────────────────────────────────────────────────────────────────────────────────────

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('info', message, optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('error', message, optionalParams)
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('warn', message, optionalParams)
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('debug', message, optionalParams)
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('debug', message, optionalParams)
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.emit('error', message, optionalParams)
  }

  /**
   * Nest calls `log(message, context)` and `error(message, stack?, context?)`: the context is the last string
   * that is not a stack.
   */
  private emit(level: LogLevel, message: unknown, params: unknown[]): void {
    if (!this.enabled(level)) return

    const last = params.at(-1)
    const context = typeof last === 'string' && !looksLikeStack(last) ? last : undefined
    if (this.pretty && context && NOISY_CONTEXTS.has(context) && level !== 'error' && level !== 'warn') return

    const stack = params.find((param): param is string => looksLikeStack(param))
    const error =
      message instanceof Error
        ? message
        : typeof message === 'string' && looksLikeStack(message)
          ? this.errorFromStack(message)
          : undefined

    if (level === 'error' && (error || stack)) {
      const detail = toErrorDetail(error ?? String(message), context)
      if (!detail.stack && stack) detail.stack = stack
      if (this.pretty) this.write(renderErrorBlock(detail, this.ctx).join('\n'))
      else this.json('error', detail.message, { context, error: detail.name, stack: detail.stack })

      return
    }

    const text =
      typeof message === 'string' ? message : message instanceof Error ? message.message : JSON.stringify(message)
    if (!this.pretty) {
      this.json(level, text, { context })

      return
    }

    const { painter, palette } = this.ctx
    const styles: Record<LogLevel, Style> = {
      debug: palette.muted,
      info: palette.hint,
      warn: palette.warn,
      error: palette.error,
    }
    const head = `${painter.paint(formatClock(this.now()), palette.muted)}  ${painter.paint(LEVEL_LABEL[level].padEnd(5), styles[level])}`
    const where = context ? `${painter.paint(`[${context}]`, palette.muted)} ` : ''
    this.write(` ${head}  ${where}${painter.paint(text, level === 'debug' ? palette.muted : palette.fg)}`)
  }

  /** `"TypeError: x is not a function\n    at …"` back into an error. */
  private errorFromStack(stack: string): Error {
    const [first] = stack.split('\n')
    const separator = first.indexOf(': ')
    const error = new Error(separator === -1 ? first : first.slice(separator + 2))
    error.name = separator === -1 ? 'Error' : first.slice(0, separator)
    error.stack = stack

    return error
  }
}
