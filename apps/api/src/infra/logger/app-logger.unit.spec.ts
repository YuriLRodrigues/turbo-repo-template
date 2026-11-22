import { describe, expect, it } from 'vitest'

import { AppLogger } from './app-logger'
import { type LoggerConfig, resolveLoggerConfig } from './logger-config'

const now = () => new Date(2026, 0, 1, 14, 32, 7)

function makeLogger(config: Partial<LoggerConfig> = {}) {
  const lines: string[] = []
  const logger = new AppLogger({
    config: { ...resolveLoggerConfig({}), ...config },
    colorLevel: 'none',
    columns: 120,
    write: (line) => lines.push(...line.split('\n')),
    now,
  })

  return { logger, lines }
}

describe('resolveLoggerConfig', () => {
  it('is pretty in development and json in production', () => {
    expect(resolveLoggerConfig({})).toEqual({
      format: 'pretty',
      level: 'info',
      brand: 'APP',
      banner: true,
      requests: true,
    })
    expect(resolveLoggerConfig({ NODE_ENV: 'production' }).format).toBe('json')
  })

  it('reads the LOG_* variables and ignores unknown values', () => {
    const config = resolveLoggerConfig({
      LOG_FORMAT: 'JSON',
      LOG_LEVEL: 'loud',
      LOG_BRAND: ' Acme ',
      LOG_BANNER: 'off',
      LOG_REQUESTS: 'maybe',
    })

    expect(config).toEqual({ format: 'json', level: 'info', brand: 'Acme', banner: false, requests: true })
  })
})

describe('AppLogger (pretty)', () => {
  it('writes time, level, context and message', () => {
    const { logger, lines } = makeLogger()
    logger.log('Note archived', 'OnNoteArchived')
    logger.warn('careful')

    expect(lines).toEqual([' 14:32:07  INFO   [OnNoteArchived] Note archived', ' 14:32:07  WARN   careful'])
  })

  it("hides Nest's boot noise, but never its warnings or errors", () => {
    const { logger, lines } = makeLogger()
    logger.log('AppModule dependencies initialized', 'InstanceLoader')
    logger.log('Mapped {/notes, GET} route', 'RouterExplorer')
    logger.warn('deprecated', 'NestApplication')

    expect(lines).toEqual([' 14:32:07  WARN   [NestApplication] deprecated'])
  })

  it('respects the level', () => {
    const { logger, lines } = makeLogger({ level: 'warn' })
    logger.debug('a')
    logger.log('b')
    logger.error('c')

    expect(lines).toEqual([' 14:32:07  ERROR  c'])
  })

  it('turns an Error, or a message with a stack, into an error block', () => {
    const { logger, lines } = makeLogger()
    const error = new TypeError('x is not a function')
    error.stack = 'TypeError: x is not a function\n    at run (src/a.ts:1:1)'
    logger.error(error, undefined, 'HttpErrorFilter')
    logger.error('failed', 'Error: failed\n    at boot (src/main.ts:2:2)', 'Bootstrap')

    expect(lines).toEqual([
      ' [ERROR] TypeError: x is not a function · HttpErrorFilter',
      '     at run (src/a.ts:1:1)',
      ' [ERROR] Error: failed · Bootstrap',
      '     at boot (src/main.ts:2:2)',
    ])
  })

  it('draws the boot: banner, checks, routes and ready', () => {
    const { logger, lines } = makeLogger({ brand: 'Acme' })
    logger.banner({ version: '1.0.0', env: 'development', node: 'v24.0.0' })
    logger.check({ status: 'ok', label: 'env', detail: 'validated' })
    logger.check({ status: 'fail', label: 'Postgres', detail: 'refused' })
    logger.routes([{ method: 'GET', path: '/health', controller: 'Health', access: { kind: 'public' } }])
    logger.ready({ elapsedMs: 250, url: 'http://localhost:3333', docsPath: '/docs' })
    const text = lines.join('\n')

    expect(text).toContain('█████╗')
    expect(text).toContain('   ✔ env       validated')
    expect(text).toContain('   GET     /health  public  Health')
    expect(text).toContain('⚠ ready in 250ms with 1 failed check(s)')
  })

  it('skips the banner and the request lines when they are turned off', () => {
    const { logger, lines } = makeLogger({ banner: false, requests: false })
    logger.banner({ version: '1.0.0', env: 'development', node: 'v24.0.0' })
    logger.request({ time: now(), method: 'GET', path: '/notes', status: 200, durationMs: 3 })

    expect(lines).toEqual([])
  })

  it('explains a failed boot', () => {
    const { logger, lines } = makeLogger()
    logger.bootFailed(new Error('Invalid environment variables:\n✖ JWT_SECRET: too short'))

    expect(lines).toContain(' [BOOT] ✖ Invalid environment variables:')
    expect(lines).toContain('     hint › compare your .env with .env.example')
  })
})

describe('AppLogger (json)', () => {
  it('writes one object per line and no art', () => {
    const { logger, lines } = makeLogger({ format: 'json' })
    logger.banner({ version: '1.0.0', env: 'production', node: 'v24.0.0' })
    logger.routes([])
    logger.log('hello', 'Ctx')
    logger.check({ status: 'ok', label: 'env', detail: 'validated' })
    logger.request({
      time: now(),
      method: 'GET',
      path: '/notes/:id',
      status: 404,
      durationMs: 3.4,
      code: 'NOTE.NOT_FOUND',
    })
    logger.ready({ elapsedMs: 99.6, url: 'http://localhost:3333' })
    const records = lines.map((line) => JSON.parse(line) as Record<string, unknown>)

    expect(records).toHaveLength(4)
    expect(records[0]).toMatchObject({ level: 'info', message: 'hello', context: 'Ctx', time: now().toISOString() })
    expect(records[1]).toMatchObject({ message: 'boot check', check: 'env', status: 'ok' })
    expect(records[2]).toMatchObject({
      level: 'warn',
      message: 'request',
      status: 404,
      durationMs: 3,
      code: 'NOTE.NOT_FOUND',
    })
    expect(records[3]).toMatchObject({ message: 'ready', elapsedMs: 100 })
  })

  it('keeps the stack of an error in a field', () => {
    const { logger, lines } = makeLogger({ format: 'json' })
    const error = new Error('boom')
    logger.error(error, undefined, 'HttpErrorFilter')

    expect(JSON.parse(lines[0])).toMatchObject({
      level: 'error',
      message: 'boom',
      context: 'HttpErrorFilter',
      stack: error.stack,
    })
  })
})
