import { describe, expect, it } from 'vitest'

import { createPainter, padEndVisible, stripAnsi, toAnsi16, toAnsi256, visibleWidth } from './ansi'
import {
  backgroundFromColorFgBg,
  backgroundFromRgb,
  detectBackground,
  parseBackgroundSetting,
  parseOsc11Answer,
  queryTerminalBackground,
  type TerminalInput,
} from './background'
import { renderBanner } from './banner'
import { explainBootError, renderBootFailure, renderCheck, renderReady } from './boot'
import { resolveColorLevel } from './color-support'
import { parseStack, renderErrorBlock, toErrorDetail } from './error-block'
import { artWidth, renderBlockText, renderPixelText, spaceOut, toDrawableText } from './glyphs'
import { gradientAt, paintHorizontalGradient } from './gradient'
import { paletteFor } from './palette'
import { renderRequestLine } from './request-line'
import { renderRouteTable, sortRoutes } from './route-table'
import { formatClock, formatDuration } from './time-format'

const plain = { painter: createPainter('none'), palette: paletteFor('dark') }
const colored = { painter: createPainter('truecolor'), palette: paletteFor('dark') }

describe('ansi', () => {
  it('writes nothing when colors are off', () => {
    expect(createPainter('none').paint('text', { fg: '#FF0000', bold: true })).toBe('text')
  })

  it('writes 24-bit, 256 and 16-color codes for the same style', () => {
    expect(createPainter('truecolor').paint('x', { fg: '#3B82F6' })).toBe('\x1b[38;2;59;130;246mx\x1b[0m')
    expect(createPainter('ansi256').paint('x', { fg: '#FF0000', bold: true })).toBe('\x1b[1;38;5;196mx\x1b[0m')
    expect(createPainter('ansi16').paint('x', { bg: '#000000' })).toBe('\x1b[40mx\x1b[0m')
  })

  it('maps grays to the gray ramp and colors to the closest basic color', () => {
    expect(toAnsi256([128, 128, 128])).toBe(243)
    expect(toAnsi256([255, 255, 255])).toBe(231)
    expect(toAnsi16([250, 250, 250])).toBe(97)
  })

  it('measures and pads by what is visible', () => {
    const painted = colored.painter.paint('abc', { fg: '#FFFFFF' })

    expect(stripAnsi(painted)).toBe('abc')
    expect(visibleWidth(painted)).toBe(3)
    expect(stripAnsi(padEndVisible(painted, 5))).toBe('abc  ')
  })
})

describe('color support', () => {
  it('lets NO_COLOR win over everything', () => {
    expect(resolveColorLevel({ env: { NO_COLOR: '1', FORCE_COLOR: '3' }, isTTY: true, colorDepth: 24 })).toBe('none')
  })

  it('writes no color to a pipe unless FORCE_COLOR asks', () => {
    expect(resolveColorLevel({ env: {}, isTTY: false })).toBe('none')
    expect(resolveColorLevel({ env: { FORCE_COLOR: '3' }, isTTY: false })).toBe('truecolor')
  })

  it('follows the depth the terminal reports', () => {
    expect(resolveColorLevel({ env: {}, isTTY: true, colorDepth: 24 })).toBe('truecolor')
    expect(resolveColorLevel({ env: {}, isTTY: true, colorDepth: 8 })).toBe('ansi256')
    expect(resolveColorLevel({ env: { TERM: 'dumb' }, isTTY: true, colorDepth: 24 })).toBe('none')
  })
})

describe('terminal background', () => {
  it('reads the setting and COLORFGBG', () => {
    expect(parseBackgroundSetting(' Light ')).toBe('light')
    expect(parseBackgroundSetting('whatever')).toBe('auto')
    expect(backgroundFromColorFgBg('0;15')).toBe('light')
    expect(backgroundFromColorFgBg('15;0')).toBe('dark')
    expect(backgroundFromColorFgBg('0;default')).toBeUndefined()
  })

  it('parses the OSC 11 answer and decides by brightness', () => {
    const white = parseOsc11Answer('\x1b]11;rgb:ffff/ffff/ffff\x07')
    const dark = parseOsc11Answer('\x1b]11;rgb:1e/1e/2e\x1b\\')

    expect(white && backgroundFromRgb(white)).toBe('light')
    expect(dark && backgroundFromRgb(dark)).toBe('dark')
    expect(parseOsc11Answer('garbage')).toBeUndefined()
  })

  it('asks the terminal and gives stdin back as it found it', async () => {
    const listeners: Array<(chunk: string) => void> = []
    const calls: string[] = []
    const input: TerminalInput = {
      isTTY: true,
      isRaw: false,
      readableFlowing: null,
      setRawMode: (mode) => calls.push(`raw:${mode}`),
      on: (_event, listener) => listeners.push(listener),
      off: () => calls.push('off'),
      resume: () => calls.push('resume'),
      pause: () => calls.push('pause'),
    }
    const output = {
      isTTY: true,
      write: () => queueMicrotask(() => listeners.forEach((l) => l('\x1b]11;rgb:ffff/ffff/ffff\x07\x1b[?62;c'))),
    }

    await expect(detectBackground({ env: {}, input, output })).resolves.toBe('light')
    expect(calls).toEqual(['raw:true', 'resume', 'off', 'raw:false', 'pause'])
  })

  it('falls back to dark when the terminal stays silent or there is no TTY', async () => {
    const silent: TerminalInput = {
      isTTY: true,
      setRawMode: () => undefined,
      on: () => undefined,
      off: () => undefined,
      resume: () => undefined,
      pause: () => undefined,
    }

    await expect(
      queryTerminalBackground({ input: silent, output: { isTTY: true, write: () => undefined }, timeoutMs: 5 }),
    ).resolves.toBeUndefined()
    await expect(detectBackground({ env: {}, input: { ...silent, isTTY: false }, output: {} as never })).resolves.toBe(
      'dark',
    )
    await expect(detectBackground({ env: { LOG_BACKGROUND: 'light' } })).resolves.toBe('light')
  })
})

describe('glyphs', () => {
  it('keeps only what the fonts can draw', () => {
    expect(toDrawableText('  Ação_2.0 — ok!  ')).toBe('ACAO 2 0 OK')
    expect(toDrawableText('✨')).toBe('')
  })

  it('draws big letters in 6 rows and medium letters in 3, all rows aligned', () => {
    const big = renderBlockText('ab')
    const medium = renderPixelText('ab')

    expect(big).toHaveLength(6)
    expect(medium).toEqual(['▄▀▄ █▀▄', '█▀█ █▀▄', '▀ ▀ ▀▀'])
    expect(artWidth(big)).toBe(16)
    expect(spaceOut('hello w')).toBe('H E L L O   W')
  })
})

describe('gradient', () => {
  it('interpolates between the stops', () => {
    expect(gradientAt(['#000000', '#FFFFFF'], 0)).toBe('#000000')
    expect(gradientAt(['#000000', '#FFFFFF'], 0.5)).toBe('#808080')
    expect(gradientAt(['#000000', '#FFFFFF'], 2)).toBe('#FFFFFF')
  })

  it('colors by column, skips spaces and keeps the text', () => {
    const [row] = paintHorizontalGradient(['a b'], ['#FF0000', '#0000FF'], colored.painter)

    expect(stripAnsi(row)).toBe('a b')
    expect(row).toContain('38;2;255;0;0')
    expect(row).toContain('38;2;0;0;255')
    expect(paintHorizontalGradient(['a b'], ['#FF0000'], plain.painter)).toEqual(['a b'])
  })
})

describe('banner', () => {
  const info = { brand: 'NestJS', version: '1.2.3', env: 'development', node: 'v24.0.0', pid: 42 }

  it('draws the brand, the signature and the facts', () => {
    const lines = renderBanner(info, { ...plain, columns: 120 })

    expect(lines.slice(0, 6)).toEqual(renderBlockText('NESTJS').map((row) => ` ${row}`))
    expect(lines.slice(6, 9)).toEqual(renderPixelText('API').map((row) => ` ${row}`))
    expect(lines.at(-1)).toBe(' v1.2.3 · development · node v24.0.0 · pid 42')
  })

  it('never wraps: steps down to text in a narrow terminal', () => {
    for (const columns of [20, 40, 60, 80]) {
      const lines = renderBanner(info, { ...plain, columns })

      expect(Math.max(...lines.slice(0, -1).map(visibleWidth))).toBeLessThan(columns)
    }
    expect(renderBanner(info, { ...plain, columns: 20 })[0]).toBe(' N E S T J S')
  })

  it('ends the gradient in the opposite of the background', () => {
    const lightEnd = paletteFor('light').gradient.at(-1)
    const darkEnd = paletteFor('dark').gradient.at(-1)

    expect(darkEnd).toBe('#FFFFFF')
    expect(lightEnd).toBe('#0B0D12')
  })
})

describe('boot', () => {
  it('renders one line per check, with the hint under a failure', () => {
    expect(renderCheck({ status: 'ok', label: 'env', detail: 'validated', durationMs: 2 }, plain)).toEqual([
      `   ✔ env       ${'validated'.padEnd(34)}    2ms`,
    ])
    expect(renderCheck({ status: 'fail', label: 'Postgres', detail: 'refused', hint: 'start it' }, plain)).toEqual([
      '   ✖ Postgres  refused',
      `${' '.repeat(15)}hint › start it`,
    ])
  })

  it('says ready, or ready with failures', () => {
    const info = { elapsedMs: 1234, url: 'http://localhost:3333', docsPath: '/docs' }

    expect(renderReady({ ...info, checks: [] }, plain)).toBe(' ✔ ready in 1.2s · http://localhost:3333 · docs /docs')
    expect(renderReady({ ...info, checks: [{ status: 'fail', label: 'Postgres' }] }, plain)).toContain(
      '⚠ ready in 1.2s with 1 failed check(s)',
    )
  })

  it('explains the usual boot errors', () => {
    expect(explainBootError('listen EADDRINUSE: address already in use :::3333')).toContain('port 3333')
    expect(explainBootError('Invalid environment variables:\n✖ x')).toContain('.env.example')
    expect(explainBootError('connect ECONNREFUSED 127.0.0.1:5432')).toContain('remove DATABASE_URL')
    expect(explainBootError('Could not apply the migrations to the embedded database in C:/x/.pglite/data.')).toContain(
      'safe to delete',
    )
    // The embedded database could not start at all: there is no folder to blame.
    expect(explainBootError('The embedded database needs @electric-sql/pglite.')).toBeUndefined()
    expect(explainBootError('something else')).toBeUndefined()
    expect(renderBootFailure({ message: 'Invalid environment variables:\n✖ JWT_SECRET', hint: 'h' }, plain)).toEqual([
      ' [BOOT] ✖ Invalid environment variables:',
      '     ✖ JWT_SECRET',
      '     hint › h',
      '   ✖ process exited (code 1)',
    ])
  })
})

describe('route table', () => {
  const routes = [
    { method: 'POST', path: '/notes', controller: 'CreateNote', access: { kind: 'authenticated' as const } },
    { method: 'GET', path: '/users', controller: 'ListUsers', access: { kind: 'roles' as const, roles: ['ADMIN'] } },
    { method: 'GET', path: '/notes', controller: 'ListNotes', access: { kind: 'authenticated' as const } },
    { method: 'GET', path: '/health', controller: 'Health', access: { kind: 'public' as const } },
  ]

  it('sorts by path, then by method', () => {
    expect(sortRoutes(routes).map((route) => `${route.method} ${route.path}`)).toEqual([
      'GET /health',
      'GET /notes',
      'POST /notes',
      'GET /users',
    ])
  })

  it('shows who can call each route, in aligned columns', () => {
    expect(renderRouteTable(routes, plain)).toEqual([
      ' routes · 4 routes',
      '   GET     /health  public  Health',
      '   GET     /notes   jwt     ListNotes',
      '   POST    /notes   jwt     CreateNote',
      '   GET     /users   ADMIN   ListUsers',
    ])
  })
})

describe('request line', () => {
  const entry = { time: new Date(2026, 0, 1, 14, 32, 7), method: 'POST', path: '/notes', status: 201, durationMs: 12 }

  it('shows time, method, path, status and duration', () => {
    expect(renderRequestLine(entry, plain)).toBe(` 14:32:07  POST    ${'/notes'.padEnd(28)} 201     12ms`)
  })

  it('adds the error code, the actor and the request id', () => {
    const line = renderRequestLine(
      { ...entry, status: 409, code: 'NOTE.ARCHIVED', actor: 'USER 1a2b3c4d', requestId: '9f8e7d6c-aaaa' },
      plain,
    )

    expect(line.endsWith('  NOTE.ARCHIVED  USER 1a2b3c4d · rid 9f8e7d6c')).toBe(true)
  })

  it('marks an aborted request and colors the status by class', () => {
    expect(renderRequestLine({ ...entry, aborted: true }, plain)).toContain(' abort ')
    expect(renderRequestLine({ ...entry, status: 500 }, colored)).toContain('38;2;255;77;79')
  })
})

describe('error block', () => {
  it('separates the app frames from the framework ones', () => {
    const frames = parseStack(
      'Error: x\n    at run (C:\\app\\src\\a.ts:1:1)\n    at next (C:\\app\\node_modules\\express\\x.js:2:2)\n    at node:internal/timers:3:3',
    )

    expect(frames.map((frame) => frame.own)).toEqual([true, false, false])
  })

  it('renders name, message, context, frames and the cause', () => {
    const error = new Error('boom', { cause: new TypeError('root') })
    error.stack = 'Error: boom\n    at run (src/a.ts:1:1)'
    const lines = renderErrorBlock(toErrorDetail(error, 'HttpErrorFilter'), plain)

    expect(lines[0]).toBe(' [ERROR] Error: boom · HttpErrorFilter')
    expect(lines[1]).toBe('     at run (src/a.ts:1:1)')
    expect(lines).toContain('   caused by')
    expect(lines.some((line) => line.includes('TypeError: root'))).toBe(true)
    expect(toErrorDetail('plain text').message).toBe('plain text')
  })

  it('cuts a long stack after the first frames', () => {
    const stack = ['Error: x', ...Array.from({ length: 12 }, (_, i) => `    at f${i} (src/a.ts:${i}:1)`)].join('\n')
    const lines = renderErrorBlock({ name: 'Error', message: 'x', stack }, plain)

    expect(lines.at(-1)).toBe('     … 4 more frames')
  })
})

describe('time format', () => {
  it('formats durations and the clock', () => {
    expect(formatDuration(12.4)).toBe('12ms')
    expect(formatDuration(1234)).toBe('1.2s')
    expect(formatDuration(125_000)).toBe('2m 05s')
    expect(formatClock(new Date(2026, 0, 1, 9, 5, 3))).toBe('09:05:03')
  })
})
