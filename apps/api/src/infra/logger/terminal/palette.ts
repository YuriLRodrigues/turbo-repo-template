import type { Style } from './ansi'
import type { Background } from './background'

/** Color roles. Renderers never know a hex value: they ask for the role. Red is reserved for errors. */
export type Palette = {
  /** Banner gradient: brand blue → the opposite of the terminal background. */
  gradient: string[]
  brand: Style
  strong: Style
  fg: Style
  muted: Style
  ok: Style
  warn: Style
  error: Style
  errorBadge: Style
  hint: Style
  methods: Record<string, Style | undefined>
  status: { s2xx: Style; s3xx: Style; s4xx: Style; s5xx: Style }
  slow: Style
}

const DARK: Palette = {
  gradient: ['#3B82F6', '#FFFFFF'],
  brand: { fg: '#60A5FA', bold: true },
  strong: { fg: '#F5F7FA', bold: true },
  fg: { fg: '#D5DAE1' },
  muted: { fg: '#8C97A7' },
  ok: { fg: '#4ADE80' },
  warn: { fg: '#FACC15' },
  error: { fg: '#FF6B6B' },
  errorBadge: { fg: '#FFFFFF', bg: '#DC2626', bold: true },
  hint: { fg: '#7DD3FC' },
  methods: {
    GET: { fg: '#61AFFE', bold: true },
    POST: { fg: '#49CC90', bold: true },
    PUT: { fg: '#FCA130', bold: true },
    PATCH: { fg: '#50E3C2', bold: true },
    DELETE: { fg: '#C792EA', bold: true },
  },
  status: {
    s2xx: { fg: '#4ADE80' },
    s3xx: { fg: '#67E8F9' },
    s4xx: { fg: '#FACC15' },
    s5xx: { fg: '#FF4D4F', bold: true },
  },
  slow: { fg: '#FB923C' },
}

const LIGHT: Palette = {
  gradient: ['#2563EB', '#0B0D12'],
  brand: { fg: '#1D4ED8', bold: true },
  strong: { fg: '#0B0D12', bold: true },
  fg: { fg: '#1F2937' },
  muted: { fg: '#6B7280' },
  ok: { fg: '#15803D' },
  warn: { fg: '#A16207' },
  error: { fg: '#B91C1C' },
  errorBadge: { fg: '#FFFFFF', bg: '#B91C1C', bold: true },
  hint: { fg: '#0369A1' },
  methods: {
    GET: { fg: '#1D4ED8', bold: true },
    POST: { fg: '#15803D', bold: true },
    PUT: { fg: '#B45309', bold: true },
    PATCH: { fg: '#0F766E', bold: true },
    DELETE: { fg: '#7E22CE', bold: true },
  },
  status: {
    s2xx: { fg: '#15803D' },
    s3xx: { fg: '#0E7490' },
    s4xx: { fg: '#A16207' },
    s5xx: { fg: '#B91C1C', bold: true },
  },
  slow: { fg: '#C2410C' },
}

export function paletteFor(background: Background): Palette {
  return background === 'light' ? LIGHT : DARK
}
