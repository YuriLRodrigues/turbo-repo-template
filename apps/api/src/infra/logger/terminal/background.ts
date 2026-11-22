/**
 * Is the terminal dark or light? The banner gradient ends in the opposite of the background (white on a dark
 * terminal, near-black on a light one), so the answer picks the palette.
 *
 *   LOG_BACKGROUND = auto | dark | light   (default: auto)
 *
 * `auto` tries, in this order: `COLORFGBG` (set by rxvt, Konsole and others), asking the terminal itself (OSC 11),
 * and finally assumes dark.
 */
export type Background = 'dark' | 'light'
export type BackgroundSetting = Background | 'auto'

/** Channels from 0 to 1. */
export type RgbColor = { r: number; g: number; b: number }

export function parseBackgroundSetting(value: string | undefined): BackgroundSetting {
  const normalized = value?.trim().toLowerCase()

  return normalized === 'dark' || normalized === 'light' ? normalized : 'auto'
}

/** `COLORFGBG` looks like `15;0` or `0;default;15`: the last field is the background's palette index. */
export function backgroundFromColorFgBg(value: string | undefined): Background | undefined {
  const last = value?.split(';').at(-1)?.trim()
  if (!last || !/^\d+$/.test(last)) return undefined

  const index = Number(last)
  if (index === 7 || index === 15) return 'light'
  if (index <= 6 || index === 8) return 'dark'

  return undefined
}

const ESC = '\x1b'

/** OSC 11 asks the background color; DA1 right behind it is answered by every terminal, so we know when to stop. */
export const BACKGROUND_QUERY = `${ESC}]11;?${ESC}\\${ESC}[c`

// Answer: ESC ] 11 ; rgb:RRRR/GGGG/BBBB, ended by BEL or ST. Each channel has 1 to 4 hex digits.
const OSC11_ANSWER = new RegExp(
  `${ESC}\\]11;rgba?:([0-9a-f]{1,4})/([0-9a-f]{1,4})/([0-9a-f]{1,4})(?:/[0-9a-f]{1,4})?(?:\\x07|${ESC}\\\\)`,
  'i',
)
const DA1_ANSWER = new RegExp(`${ESC}\\[\\?[\\d;]*c`)

function channel(hex: string): number {
  return Number.parseInt(hex, 16) / (16 ** hex.length - 1)
}

export function parseOsc11Answer(data: string): RgbColor | undefined {
  const match = OSC11_ANSWER.exec(data)
  if (!match) return undefined

  return { r: channel(match[1]), g: channel(match[2]), b: channel(match[3]) }
}

/** Perceived brightness (Rec. 601 weights). Above 0.5, black text reads better than white. */
export function backgroundFromRgb({ r, g, b }: RgbColor): Background {
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.5 ? 'light' : 'dark'
}

/** The part of `process.stdin` the query needs, so it can be tested without a terminal. */
export type TerminalInput = {
  isTTY?: boolean
  isRaw?: boolean
  readableFlowing?: boolean | null
  setRawMode?(mode: boolean): unknown
  on(event: 'data', listener: (chunk: Buffer | string) => void): unknown
  off(event: 'data', listener: (chunk: Buffer | string) => void): unknown
  resume(): unknown
  pause(): unknown
}

export type TerminalOutput = {
  isTTY?: boolean
  write(chunk: string): unknown
}

export const BACKGROUND_QUERY_TIMEOUT_MS = 150

/**
 * Asks the terminal for its background color. Never hangs (a silent terminal hits the timeout) and always gives
 * stdin back the way it found it (raw mode and paused state).
 */
export function queryTerminalBackground({
  input,
  output,
  timeoutMs = BACKGROUND_QUERY_TIMEOUT_MS,
}: {
  input: TerminalInput
  output: TerminalOutput
  timeoutMs?: number
}): Promise<RgbColor | undefined> {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') return Promise.resolve(undefined)

  const setRawMode = input.setRawMode.bind(input)
  const wasRaw = input.isRaw === true
  const wasFlowing = input.readableFlowing === true

  return new Promise((resolve) => {
    let buffer = ''
    let settled = false

    const finish = (): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      input.off('data', onData)
      try {
        setRawMode(wasRaw)
      } catch {
        // The terminal is gone: nothing to restore.
      }
      if (!wasFlowing) input.pause()
      resolve(parseOsc11Answer(buffer))
    }

    const onData = (chunk: Buffer | string): void => {
      buffer += String(chunk)
      if (DA1_ANSWER.test(buffer)) finish()
    }

    const timer = setTimeout(finish, timeoutMs)

    try {
      setRawMode(true)
      input.on('data', onData)
      input.resume()
      output.write(BACKGROUND_QUERY)
    } catch {
      finish()
    }
  })
}

export async function detectBackground({
  env = process.env,
  input = process.stdin,
  output = process.stdout,
  timeoutMs,
}: {
  env?: Record<string, string | undefined>
  input?: TerminalInput
  output?: TerminalOutput
  timeoutMs?: number
} = {}): Promise<Background> {
  const setting = parseBackgroundSetting(env.LOG_BACKGROUND)
  if (setting !== 'auto') return setting

  const fromEnv = backgroundFromColorFgBg(env.COLORFGBG)
  if (fromEnv) return fromEnv

  const color = await queryTerminalBackground({ input, output, timeoutMs })

  return color ? backgroundFromRgb(color) : 'dark'
}
