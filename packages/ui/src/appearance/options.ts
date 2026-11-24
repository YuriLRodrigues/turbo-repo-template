/*
 * What a person can change about the look of the app. The values are the `data-*` attributes on <html> that
 * src/styles/tokens.css reads; the labels are product copy.
 *
 * The API stores the same object in the user's preferences (apps/api: domain/identity/enterprise/preferences/
 * appearance.ts): keep the value lists and the defaults in sync with it. A unit spec of the API compares them.
 */

export const THEME_CHOICES = ['system', 'light', 'dark'] as const
export type ThemeChoice = (typeof THEME_CHOICES)[number]
export type Theme = Exclude<ThemeChoice, 'system'>

export const ACCENTS = ['neutral', 'blue', 'violet', 'emerald', 'amber', 'rose'] as const
export type Accent = (typeof ACCENTS)[number]

export const DENSITIES = ['comfortable', 'compact'] as const
export type Density = (typeof DENSITIES)[number]

export type Appearance = {
  theme: ThemeChoice
  accent: Accent
  density: Density
  /** Transitions end at once and nothing loops, whatever the system says. */
  reduceMotion: boolean
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: 'system',
  accent: 'rose',
  density: 'comfortable',
  reduceMotion: false,
}

export const THEME_LABELS: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' }

export const ACCENT_LABELS: Record<Accent, string> = {
  neutral: 'Neutral',
  blue: 'Blue',
  violet: 'Violet',
  emerald: 'Emerald',
  amber: 'Amber',
  rose: 'Rose',
}

export const DENSITY_LABELS: Record<Density, string> = { comfortable: 'Comfortable', compact: 'Compact' }

/**
 * `--bg-base` of each theme as sRGB, for `<meta name="theme-color">` (the browser and the system bars take the color
 * of the page). tooling/contrast-check.mjs fails when one of them drifts from tokens.css.
 */
export const THEME_COLORS: Record<Theme, string> = { light: '#fafafa', dark: '#09090c' }
