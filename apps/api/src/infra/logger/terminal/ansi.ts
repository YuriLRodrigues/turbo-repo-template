/**
 * The only place that knows escape sequences. Renderers ask a `Painter` for a `Style`; the painter writes it in
 * whatever the terminal supports (24-bit, 256 colors, 16 colors or nothing).
 */
export type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor'

export type Style = {
  /** `#RRGGBB` */
  fg?: string
  /** `#RRGGBB` */
  bg?: string
  bold?: boolean
  dim?: boolean
}

export type Painter = {
  level: ColorLevel
  enabled: boolean
  paint(text: string, style?: Style): string
}

type Rgb = [number, number, number]

const ESC = '\x1b'

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16)

  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** Index in the xterm 256-color table: the 6x6x6 cube, or the gray ramp for near-gray colors. */
export function toAnsi256([r, g, b]: Rgb): number {
  if (Math.max(r, g, b) - Math.min(r, g, b) < 10) {
    if (r < 8) return 16
    if (r > 248) return 231

    return 232 + Math.round(((r - 8) / 247) * 23)
  }
  const cube = (channel: number) => Math.round((channel / 255) * 5)

  return 16 + 36 * cube(r) + 6 * cube(g) + cube(b)
}

const BASIC: Rgb[] = [
  [0, 0, 0],
  [205, 49, 49],
  [13, 188, 121],
  [229, 229, 16],
  [36, 114, 200],
  [188, 63, 188],
  [17, 168, 205],
  [229, 229, 229],
  [102, 102, 102],
  [241, 76, 76],
  [35, 209, 139],
  [245, 245, 67],
  [59, 142, 234],
  [214, 112, 214],
  [41, 184, 219],
  [255, 255, 255],
]

/** SGR foreground code of the closest of the 16 basic colors (30–37, 90–97). Background is +10. */
export function toAnsi16(rgb: Rgb): number {
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  BASIC.forEach((candidate, index) => {
    const distance = candidate.reduce((sum, channel, i) => sum + (channel - rgb[i]) ** 2, 0)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })

  return best < 8 ? 30 + best : 90 + (best - 8)
}

function colorCode(hex: string, level: ColorLevel, background: boolean): string {
  const rgb = hexToRgb(hex)
  if (level === 'truecolor') return `${background ? 48 : 38};2;${rgb.join(';')}`
  if (level === 'ansi256') return `${background ? 48 : 38};5;${toAnsi256(rgb)}`

  return String(toAnsi16(rgb) + (background ? 10 : 0))
}

export function createPainter(level: ColorLevel): Painter {
  const enabled = level !== 'none'

  return {
    level,
    enabled,
    paint(text, style) {
      if (!enabled || !style || text === '') return text
      const codes: string[] = []
      if (style.bold) codes.push('1')
      if (style.dim) codes.push('2')
      if (style.fg) codes.push(colorCode(style.fg, level, false))
      if (style.bg) codes.push(colorCode(style.bg, level, true))

      return codes.length ? `${ESC}[${codes.join(';')}m${text}${ESC}[0m` : text
    },
  }
}

// CSI sequences (colors, cursor) and OSC sequences (titles, color queries).
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;?]*[ -/]*[@-~]|${ESC}\\][^\\x07${ESC}]*(?:\\x07|${ESC}\\\\)`, 'g')

export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

/** Columns the text takes on screen (escape sequences take none). */
export function visibleWidth(text: string): number {
  return Array.from(stripAnsi(text)).length
}

export function padEndVisible(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - visibleWidth(text)))
}

export function padStartVisible(text: string, width: number): string {
  return ' '.repeat(Math.max(0, width - visibleWidth(text))) + text
}
