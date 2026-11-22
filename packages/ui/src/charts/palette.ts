/*
 * The colors of the series. Always CSS variables of the tokens, so every chart follows the theme and the accent the
 * person picked, and passes the same contrast checks as the rest of the interface.
 */

export type ChartPalette = 'categorical' | 'accent' | 'status' | 'monochrome'

export const PALETTES: Record<ChartPalette, readonly string[]> = {
  /** Distinct hues, the accent first: series that are different things. */
  categorical: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'],
  /** The accent against greys: one series that matters and the rest as context. */
  accent: ['var(--primary)', 'var(--muted-foreground)', 'var(--border-strong)', 'var(--chart-2)', 'var(--chart-3)'],
  /** Good, attention, bad: for values that are a status. */
  status: ['var(--success)', 'var(--warning)', 'var(--destructive)', 'var(--chart-2)', 'var(--muted-foreground)'],
  /** One ink in fading strengths: calm charts, parts of one whole. */
  monochrome: ['var(--foreground)', 'var(--foreground)', 'var(--foreground)', 'var(--foreground)', 'var(--foreground)'],
}

const MONOCHROME_OPACITY = [1, 0.72, 0.5, 0.34, 0.2]

/** The color of the `index`-th series: its own `color` when it has one, the palette's otherwise. */
export const colorOf = (index: number, palette: ChartPalette = 'categorical', own?: string): string =>
  own ?? PALETTES[palette][index % PALETTES[palette].length]

/** In `monochrome`, each series is the same ink, lighter: the opacity of the `index`-th one. */
export const opacityOf = (index: number, palette: ChartPalette = 'categorical'): number =>
  palette === 'monochrome' ? MONOCHROME_OPACITY[index % MONOCHROME_OPACITY.length] : 1
