/*
 * The look of the app, outside React. The choice lives in localStorage and on <html> as `data-*` attributes;
 * src/styles/tokens.css does the rest. Components read it through `useAppearance` (use-appearance.ts) and the first
 * paint is handled by the inline script built at the end of this file, so nothing flashes.
 *
 * The store is the device. When a person is signed in, the app also sends each change to the API (the user's
 * preferences) and applies what the API answers with `applyAppearance`, so the look follows them to other devices.
 */
import {
  ACCENTS,
  type Appearance,
  DEFAULT_APPEARANCE,
  DENSITIES,
  type Theme,
  THEME_CHOICES,
  THEME_COLORS,
} from './options'

export const APPEARANCE_STORAGE_KEY = 'app.appearance'
export const DARK_QUERY = '(prefers-color-scheme: dark)'

const SWITCHING_ATTRIBUTE = 'data-appearance-switching'
const SWITCHING_MS = 350

export type AppearanceState = Appearance & { resolvedTheme: Theme }

export const SERVER_APPEARANCE: AppearanceState = { ...DEFAULT_APPEARANCE, resolvedTheme: 'light' }

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/** Anything (a parsed JSON, an API answer) as a valid appearance: unknown values fall back to the defaults. */
export const parseAppearance = (raw: unknown): Appearance => {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  return {
    theme: oneOf(source.theme, THEME_CHOICES, DEFAULT_APPEARANCE.theme),
    accent: oneOf(source.accent, ACCENTS, DEFAULT_APPEARANCE.accent),
    density: oneOf(source.density, DENSITIES, DEFAULT_APPEARANCE.density),
    reduceMotion: source.reduceMotion === true,
  }
}

const resolveTheme = (appearance: Appearance): Theme =>
  appearance.theme === 'system' ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light') : appearance.theme

export const readStoredAppearance = (): Appearance => {
  try {
    return parseAppearance(JSON.parse(window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? 'null'))
  } catch {
    // Private mode, blocked storage or a broken value: the defaults apply.
    return DEFAULT_APPEARANCE
  }
}

const store = (appearance: Appearance): void => {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    // The choice still applies to this visit.
  }
}

const setThemeColor = (color: string): void => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = color
}

let state: AppearanceState | undefined
const listeners = new Set<() => void>()

/** Writes the attributes on <html>. Only attributes change: nothing scrolls and nothing reflows but the density. */
const write = (appearance: Appearance): AppearanceState => {
  const root = document.documentElement
  const resolvedTheme = resolveTheme(appearance)

  root.dataset.themeChoice = appearance.theme
  root.dataset.theme = resolvedTheme
  root.dataset.accent = appearance.accent
  root.dataset.density = appearance.density
  if (appearance.reduceMotion) root.dataset.motion = 'reduced'
  else delete root.dataset.motion
  setThemeColor(THEME_COLORS[resolvedTheme])

  return { ...appearance, resolvedTheme }
}

let switchingTimer = 0

/** Colors cross-fade while the look changes; the attribute comes off so hover transitions keep their own timing. */
const fade = (): void => {
  const root = document.documentElement
  root.setAttribute(SWITCHING_ATTRIBUTE, '')
  window.clearTimeout(switchingTimer)
  switchingTimer = window.setTimeout(() => root.removeAttribute(SWITCHING_ATTRIBUTE), SWITCHING_MS)
}

export const subscribeAppearance = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** The current look. The first call reads what the inline script (or a previous visit) left in localStorage. */
export const getAppearance = (): AppearanceState => {
  state ??= write(readStoredAppearance())

  return state
}

/** Applies a look without saving it: an answer from the API, or the stored one again. */
export const applyAppearance = (appearance: Appearance, options: { animate?: boolean } = {}): void => {
  if (options.animate) fade()
  state = write(appearance)
  listeners.forEach((listener) => listener())
}

/** Changes part of the look, applies it at once and remembers it on this device. */
export const setAppearance = (change: Partial<Appearance>): void => {
  const next = parseAppearance({ ...getAppearance(), ...change })
  store(next)
  applyAppearance(next, { animate: true })
}

/** Re-resolves "system" when the system changes its mind, and follows a change made in another tab. */
export const followAppearance = (): (() => void) => {
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (getAppearance().theme === 'system') applyAppearance(getAppearance(), { animate: true })
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === APPEARANCE_STORAGE_KEY) applyAppearance(readStoredAppearance(), { animate: true })
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)

  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Runs in <head> before anything paints: reads the stored choice and writes the attributes, so the page never
 * flashes in the wrong theme or accent. Kept as a string because it must not wait for the bundle; it is the
 * same logic as `parseAppearance` + `write` above, without the imports.
 */
export const APPEARANCE_SCRIPT = `(function(){var d=document.documentElement,D=${JSON.stringify(DEFAULT_APPEARANCE)},a={};try{a=JSON.parse(window.localStorage.getItem('${APPEARANCE_STORAGE_KEY}'))||{}}catch(e){}function p(k,l){return l.indexOf(a[k])>-1?a[k]:D[k]}var t=p('theme',${JSON.stringify(THEME_CHOICES)}),r=t==='system'?(window.matchMedia('${DARK_QUERY}').matches?'dark':'light'):t,s=d.dataset;s.themeChoice=t;s.theme=r;s.accent=p('accent',${JSON.stringify(ACCENTS)});s.density=p('density',${JSON.stringify(DENSITIES)});if(a.reduceMotion===true)s.motion='reduced';var m=document.createElement('meta');m.name='theme-color';m.content=${JSON.stringify(THEME_COLORS)}[r];document.head.appendChild(m)})()`
