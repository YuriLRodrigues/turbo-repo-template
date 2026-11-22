import type { Dictionary } from '@/i18n/dictionaries'

/**
 * What the page knows about the product that does not change with the language: the name and the URLs. Every word
 * of the page lives in the dictionaries (`i18n/dictionaries/`). `SITE_URL` (where the page is served) and
 * `NEXT_PUBLIC_APP_URL` (where the web app is) are read at build time.
 */
export const site = {
  name: 'App',
  url: (process.env.SITE_URL ?? 'http://localhost:3502').replace(/\/+$/, ''),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3501').replace(/\/+$/, ''),
} as const

/** The sections of the page, in order: the anchors, and the key of their name in `nav` of the dictionary. */
export const sections = [
  { id: 'features', label: 'features' },
  { id: 'how-it-works', label: 'howItWorks' },
  { id: 'faq', label: 'faq' },
] as const satisfies readonly { id: string; label: keyof Dictionary['nav'] }[]
