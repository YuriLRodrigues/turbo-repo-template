export type LogFormat = 'pretty' | 'json'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggerConfig = {
  /** `pretty` for people (colors, banner, tables); `json` for log collectors, one object per line. */
  format: LogFormat
  /** The lowest level that is written. */
  level: LogLevel
  /** The name in the banner's big letters. */
  brand: string
  banner: boolean
  /** One line per HTTP request. */
  requests: boolean
}

export const LOG_LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const DEFAULT_BRAND = 'APP'

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  const normalized = value?.trim().toLowerCase()

  return allowed.find((option) => option === normalized)
}

/** `off`, `false`, `0` and `no` turn a flag off; anything else (or nothing) keeps the default. */
function flag(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return fallback
  if (['off', 'false', '0', 'no'].includes(normalized)) return false
  if (['on', 'true', '1', 'yes'].includes(normalized)) return true

  return fallback
}

/**
 * Reads the `LOG_*` variables. The logger exists before the environment is validated (it is what prints the
 * validation error), so nothing here throws: an unknown value falls back to the default.
 *
 *   LOG_FORMAT     pretty | json            default: json in production, pretty elsewhere
 *   LOG_LEVEL      debug | info | warn | error   default: info
 *   LOG_BRAND      text for the banner      default: APP_NAME in capitals, or APP
 *   LOG_BANNER     on | off                 default: on
 *   LOG_REQUESTS   on | off                 default: on
 *   LOG_BACKGROUND auto | dark | light      default: auto (see terminal/background.ts)
 */
export function resolveLoggerConfig(env: Record<string, string | undefined>): LoggerConfig {
  return {
    format: oneOf(env.LOG_FORMAT, ['pretty', 'json']) ?? (env.NODE_ENV === 'production' ? 'json' : 'pretty'),
    level: oneOf(env.LOG_LEVEL, ['debug', 'info', 'warn', 'error']) ?? 'info',
    brand: env.LOG_BRAND?.trim() || env.APP_NAME?.trim().toUpperCase() || DEFAULT_BRAND,
    banner: flag(env.LOG_BANNER, true),
    requests: flag(env.LOG_REQUESTS, true),
  }
}
