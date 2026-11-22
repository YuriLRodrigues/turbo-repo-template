import type { ColorLevel } from './ansi'

export type ColorSupportInput = {
  env: Record<string, string | undefined>
  /** `true` when the output is a terminal, not a pipe or a file. */
  isTTY: boolean
  /** What Node reports (`tty.WriteStream#getColorDepth`): 1, 4, 8 or 24. */
  colorDepth?: number
}

const RANK: Record<ColorLevel, number> = { none: 0, ansi16: 1, ansi256: 2, truecolor: 3 }

function levelFromDepth(depth: number): ColorLevel {
  if (depth >= 24) return 'truecolor'
  if (depth >= 8) return 'ansi256'
  if (depth >= 4) return 'ansi16'

  return 'none'
}

/** `FORCE_COLOR` as the Node ecosystem reads it: 0/false = off, 1/true = 16 colors, 2 = 256, 3 = 24-bit. */
function forcedLevel(value: string | undefined): ColorLevel | undefined {
  if (value === undefined) return undefined
  if (value === '0' || value === 'false') return 'none'
  if (value === '2') return 'ansi256'
  if (value === '3') return 'truecolor'

  return 'ansi16'
}

/**
 * `NO_COLOR` (https://no-color.org) wins over everything. Without a TTY (pipe, CI, log collector) no escape
 * sequence is written unless `FORCE_COLOR` asks for it.
 */
export function resolveColorLevel({ env, isTTY, colorDepth }: ColorSupportInput): ColorLevel {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return 'none'

  const forced = forcedLevel(env.FORCE_COLOR)
  if (forced === 'none') return 'none'
  if (!isTTY || env.TERM === 'dumb') return forced ?? 'none'

  const detected = levelFromDepth(colorDepth ?? 4)

  return forced && RANK[forced] > RANK[detected] ? forced : detected
}

export function detectColorLevel(
  stream: NodeJS.WriteStream = process.stdout,
  env: Record<string, string | undefined> = process.env,
): ColorLevel {
  const isTTY = stream.isTTY === true
  const colorDepth = isTTY && typeof stream.getColorDepth === 'function' ? stream.getColorDepth(env) : undefined

  return resolveColorLevel({ env, isTTY, colorDepth })
}
