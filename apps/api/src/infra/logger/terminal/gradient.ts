import { hexToRgb, type Painter, rgbToHex, toAnsi256 } from './ansi'

/** Color at position `t` (0..1) of a linear gradient with 2+ evenly spaced stops. */
export function gradientAt(stops: readonly string[], t: number): string {
  if (stops.length === 0) return '#FFFFFF'
  if (stops.length === 1) return stops[0].toUpperCase()

  const span = Math.min(1, Math.max(0, t)) * (stops.length - 1)
  const index = Math.min(stops.length - 2, Math.floor(span))
  const local = span - index
  const from = hexToRgb(stops[index])
  const to = hexToRgb(stops[index + 1])

  return rgbToHex([0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * local) as [number, number, number])
}

/**
 * Paints art with a **horizontal** gradient: the color depends only on the column, so stacked rows line up.
 * `width` lets several blocks share one gradient (the widest one sets the scale). Neighbouring columns that end up
 * in the same color are written as one run, so a 256-color terminal does not get one escape code per character.
 */
export function paintHorizontalGradient(
  rows: readonly string[],
  stops: readonly string[],
  painter: Painter,
  width = Math.max(1, ...rows.map((row) => Array.from(row).length)),
): string[] {
  if (!painter.enabled) return [...rows]

  const colorAt = (column: number) => gradientAt(stops, width <= 1 ? 0 : column / (width - 1))
  const keyOf = (color: string) => (painter.level === 'truecolor' ? color : String(toAnsi256(hexToRgb(color))))

  return rows.map((row) => {
    let out = ''
    let run = ''
    let runColor: string | undefined
    let runKey: string | undefined

    const flush = (): void => {
      if (run) out += runColor ? painter.paint(run, { fg: runColor, bold: true }) : run
      run = ''
    }

    Array.from(row).forEach((char, column) => {
      const color = char === ' ' ? undefined : colorAt(column)
      const key = color && keyOf(color)
      if (run && key !== runKey) flush()
      if (!run) {
        runColor = color
        runKey = key
      }
      run += char
    })
    flush()

    return out
  })
}
