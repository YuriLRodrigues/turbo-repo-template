// Checks that text keeps a contrast of at least 4.5:1 (WCAG AA) in every combination a person can choose: both
// themes and every accent.
//
//   npm run contrast            (from the repository root, or `npm run contrast -w @workspace/ui`)
//
// How: it reads the tokens straight from src/styles/tokens.css (the same file the browser reads), applies the cascade
// for each combination and measures every text token on every surface it can sit on: the page, a card, a popover, a
// well inside a card, a raised thumb, and each tone's text on its own tint. Then the text of the filled buttons on
// their fill.
//
// It also checks that the `theme-color` values in src/appearance/options.ts are the `--bg-base` of each theme.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8')
const options = readFileSync(join(root, 'src/appearance/options.ts'), 'utf8')

const MIN_RATIO = 4.5

const THEMES = ['light', 'dark']
const listOf = (name) => {
  const match = new RegExp(`export const ${name} = \\[([^\\]]+)\\] as const`).exec(options)
  if (!match) throw new Error(`options.ts: ${name} not found`)

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}
const ACCENTS = listOf('ACCENTS')

// ── Reading the stylesheet ──────────────────────────────────────────────────────────────────────────────────────

/** Top-level `selector { declarations }` blocks, in source order. At-rules (and what is inside them) are skipped. */
const parseBlocks = (source) => {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = []
  let at = 0
  while (at < text.length) {
    const open = text.indexOf('{', at)
    const semicolon = text.indexOf(';', at)
    if (open === -1) break
    // A statement at-rule (`@custom-variant ...;`) ends before any block opens.
    if (semicolon !== -1 && semicolon < open && text.slice(at, semicolon).trim().startsWith('@')) {
      at = semicolon + 1
      continue
    }
    let depth = 1
    let close = open + 1
    while (close < text.length && depth > 0) {
      if (text[close] === '{') depth++
      else if (text[close] === '}') depth--
      close++
    }
    const selector = text.slice(at, open).trim()
    if (!selector.startsWith('@'))
      blocks.push({ selector, body: text.slice(open + 1, close - 1), order: blocks.length })
    at = close
  }

  return blocks
}

/** `--name: value` pairs of a block. A value may span lines and contain commas and parentheses. */
const parseDeclarations = (body) => {
  const declarations = {}
  let depth = 0
  let current = ''
  for (const char of `${body};`) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ';' && depth === 0) {
      const colon = current.indexOf(':')
      const name = current.slice(0, colon).trim()
      if (colon !== -1 && name.startsWith('--'))
        declarations[name] = current
          .slice(colon + 1)
          .trim()
          .replace(/\s+/g, ' ')
      current = ''
    } else {
      current += char
    }
  }

  return declarations
}

/**
 * Whether one selector of a list applies to <html> in a state, and how specific it is. Only what tokens.css uses:
 * `:root`, `[data-x='y']`, `[data-x]` and `:not([data-x])`. A selector that is not about <html> (the swatch
 * previews, `[data-accent-preview]`) never matches.
 */
const matchSelector = (selector, state) => {
  const part = selector.trim()
  if (/\s/.test(part.replace(/\[[^\]]*\]/g, ''))) return null
  if (!part.startsWith(':root')) return null

  let specificity = 1
  let rest = part.slice(':root'.length)
  while (rest.length > 0) {
    const negated = /^:not\(\[data-([a-z-]+)\]\)/.exec(rest)
    const attribute = /^\[data-([a-z-]+)(?:='([^']*)')?\]/.exec(rest)
    if (negated) {
      if (state[negated[1]] !== undefined) return null
      rest = rest.slice(negated[0].length)
    } else if (attribute) {
      const value = state[attribute[1]]
      if (value === undefined || (attribute[2] !== undefined && value !== attribute[2])) return null
      rest = rest.slice(attribute[0].length)
    } else {
      throw new Error(`tokens.css: this selector is beyond what contrast-check.mjs understands: ${part}`)
    }
    specificity++
  }

  return specificity
}

const blocks = parseBlocks(css).map((block) => ({ ...block, declarations: parseDeclarations(block.body) }))

/** The custom properties of <html> in a state, after the cascade. */
const tokensFor = (state) => {
  const matches = []
  for (const block of blocks) {
    const specificities = block.selector
      .split(',')
      .map((selector) => matchSelector(selector, state))
      .filter((specificity) => specificity !== null)
    if (specificities.length > 0) matches.push({ ...block, specificity: Math.max(...specificities) })
  }
  matches.sort((a, b) => a.specificity - b.specificity || a.order - b.order)

  return Object.assign({}, ...matches.map((match) => match.declarations))
}

// ── Colors ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** A token as linear sRGB plus alpha. Follows `var(--x)`. */
const colorOf = (tokens, name, seen = []) => {
  const value = tokens[name]
  if (value === undefined) throw new Error(`token ${name} is not defined`)
  const reference = /^var\((--[a-z0-9-]+)\)$/.exec(value)
  if (reference) {
    if (seen.includes(name)) throw new Error(`token ${name} refers to itself`)

    return colorOf(tokens, reference[1], [...seen, name])
  }
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (!match) throw new Error(`token ${name}: "${value}" is not a literal oklch() color`)
  const [lightness, chroma, hue, alpha = '1'] = match.slice(1)

  return { ...oklchToLinear(Number(lightness), Number(chroma), Number(hue)), a: Number(alpha) }
}

const clamp = (value) => Math.min(Math.max(value, 0), 1)

/** OKLCH to linear sRGB (Björn Ottosson's matrices), clipped to the gamut. */
const oklchToLinear = (lightness, chroma, hue) => {
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3

  return {
    r: clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  }
}

const encode = (linear) => (linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055)
const decode = (encoded) => (encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4)

/** `top` painted over an opaque `bottom`, the way a browser blends: in gamma-encoded sRGB. */
const over = (top, bottom) => {
  const mix = (channel) => decode(encode(top[channel]) * top.a + encode(bottom[channel]) * (1 - top.a))

  return { r: mix('r'), g: mix('g'), b: mix('b'), a: 1 }
}

const luminance = ({ r, g, b }) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const contrast = (first, second) => {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)

  return (light + 0.05) / (dark + 0.05)
}

const toHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) =>
      Math.round(encode(channel) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

// ── The checks ──────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = [
  '--foreground',
  '--muted-foreground',
  '--primary-text',
  '--success-text',
  '--warning-text',
  '--destructive-text',
]

const results = new Map()
const failures = []

const record = (pair, ratio, where) => {
  const worst = results.get(pair)
  if (!worst || ratio < worst.ratio) results.set(pair, { ratio, where })
  if (ratio < MIN_RATIO) failures.push(`${ratio.toFixed(2)}:1  ${pair}  (${where})`)
}

const checkState = (state, label) => {
  const tokens = tokensFor(state)
  const color = (name) => colorOf(tokens, name)

  // Solid fills: the text of a filled button.
  record('primary-foreground on primary', contrast(color('--primary-foreground'), color('--primary')), label)
  record(
    'destructive-foreground on destructive',
    contrast(color('--destructive-foreground'), color('--destructive')),
    label,
  )

  const page = color('--bg-base')
  const card = over(color('--card'), page)
  const bodies = { page, card, popover: over(color('--popover'), page) }

  for (const [bodyName, body] of Object.entries(bodies)) {
    const surfaces = {
      [bodyName]: body,
      // A well (an input, a segmented track, a neutral badge) and a raised thumb, inside that surface.
      [`well on ${bodyName}`]: over(color('--muted'), body),
      [`raised on ${bodyName}`]: over(color('--raised'), body),
    }
    for (const [surfaceName, surface] of Object.entries(surfaces)) {
      for (const text of TEXT) record(`${text.slice(2)} on ${surfaceName}`, contrast(color(text), surface), label)
    }

    // Tinted pills: each tone's text on its own soft tint.
    for (const tone of ['primary', 'success', 'warning', 'destructive']) {
      record(
        `${tone}-text on ${tone}-soft on ${bodyName}`,
        contrast(color(`--${tone}-text`), over(color(`--${tone}-soft`), body)),
        label,
      )
    }
    record(
      `foreground on primary-soft on ${bodyName}`,
      contrast(color('--foreground'), over(color('--primary-soft'), body)),
      label,
    )
  }
}

let combinations = 0
for (const theme of THEMES) {
  for (const accent of ACCENTS) {
    checkState({ theme, accent }, `${theme} / ${accent}`)
    combinations++
  }
}

// ── theme-color ─────────────────────────────────────────────────────────────────────────────────────────────────

const expectedThemeColors = Object.fromEntries(
  THEMES.map((theme) => [theme, toHex(colorOf(tokensFor({ theme, accent: ACCENTS[0] }), '--bg-base'))]),
)
const themeColorsLine = /THEME_COLORS[^=]*= \{([^}]+)\}/.exec(options)?.[1] ?? ''
const themeColorProblems = THEMES.flatMap((theme) => {
  const actual = new RegExp(`${theme}: '(#[0-9a-f]{6})'`).exec(themeColorsLine)?.[1]

  return actual === expectedThemeColors[theme]
    ? []
    : [`${theme}: options.ts has ${actual}, tokens.css gives ${expectedThemeColors[theme]}`]
})

// ── Report ──────────────────────────────────────────────────────────────────────────────────────────────────────

console.log(`Contrast of text: ${combinations} combinations, minimum ${MIN_RATIO}:1\n`)
for (const [pair, { ratio, where }] of [...results].sort((a, b) => a[1].ratio - b[1].ratio)) {
  console.log(
    `${ratio < MIN_RATIO ? 'FAIL' : ' ok '}  ${ratio.toFixed(2).padStart(5)}:1  ${pair.padEnd(44)}  worst: ${where}`,
  )
}

if (themeColorProblems.length > 0) {
  console.error('\ntheme-color out of date in src/appearance/options.ts:')
  for (const problem of themeColorProblems) console.error(`  ${problem}`)
  console.error(`\nexport const THEME_COLORS = ${JSON.stringify(expectedThemeColors)}`)
}

if (failures.length > 0) {
  console.error(`\n${failures.length} measurement(s) under ${MIN_RATIO}:1. The lowest of each pair:`)
  for (const [pair, { ratio, where }] of results) {
    if (ratio < MIN_RATIO) console.error(`  ${ratio.toFixed(2)}:1  ${pair}  (${where})`)
  }
}

if (failures.length > 0 || themeColorProblems.length > 0) process.exit(1)
console.log('\nEvery pair is at or above the minimum, and theme-color matches the tokens.')
