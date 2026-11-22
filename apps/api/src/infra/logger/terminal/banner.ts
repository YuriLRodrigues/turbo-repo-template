import type { Painter } from './ansi'
import { artWidth, renderBlockText, renderPixelText, spaceOut, toDrawableText } from './glyphs'
import { paintHorizontalGradient } from './gradient'
import type { Palette } from './palette'

/** The line under the project name, in medium letters. Change it (or set `LOG_BANNER=off`) in your project. */
export const SIGNATURE = ['API']

export type BannerInfo = {
  /** `LOG_BRAND`: the name in the big letters. */
  brand: string
  version: string
  env: string
  node: string
  pid?: number
}

export type RenderContext = {
  painter: Painter
  palette: Palette
  /** Terminal columns, so the art never wraps. Without a TTY: 100. */
  columns?: number
}

const DEFAULT_COLUMNS = 100

/**
 * The boot banner: the brand in big letters and the signature in medium letters, all in one blue gradient that ends
 * in the opposite of the terminal background, then the facts of this process.
 *
 * It steps down when the terminal is narrow (big and medium letters → spaced capitals → plain text) and never wraps. The 1-column indent and a
 * free last column are part of the fit: art that touches the edge breaks in some terminals.
 */
export function renderBanner(info: BannerInfo, ctx: RenderContext): string[] {
  const { painter, palette } = ctx
  const columns = ctx.columns && ctx.columns > 0 ? ctx.columns : DEFAULT_COLUMNS
  const fits = (rows: readonly string[]) => 1 + artWidth(rows) < columns
  const brandText = toDrawableText(info.brand)

  const big = brandText ? renderBlockText(brandText) : []
  // Small text: spaced capitals when they fit, the plain text otherwise.
  const small = (text: string): string[] => (fits([spaceOut(text)]) ? [spaceOut(text)] : [text])

  const art: string[][] = []
  if (big.length && fits(big)) art.push(big)
  else if (info.brand.trim()) art.push(small(info.brand))

  // The signature in medium letters, one block per part. When a part does not fit, it goes small on one line and,
  // in a very narrow terminal, as one plain line per part.
  const parts = SIGNATURE.map((part) => renderPixelText(part))
  const oneLine = small(SIGNATURE.join(' · '))
  if (parts.every(fits)) art.push(...parts)
  else if (fits(oneLine)) art.push(oneLine)
  else art.push(...SIGNATURE.map((part) => [part]))

  // One gradient for every block: the widest sets the scale, so colors line up from top to bottom.
  const width = Math.max(1, ...art.map(artWidth))
  const facts = [`v${info.version}`, info.env, `node ${info.node}`, info.pid === undefined ? '' : `pid ${info.pid}`]

  return [
    ...art.flatMap((rows) => paintHorizontalGradient(rows, palette.gradient, painter, width)),
    painter.paint(facts.filter(Boolean).join(' · '), palette.muted),
  ].map((row) => ` ${row}`)
}
