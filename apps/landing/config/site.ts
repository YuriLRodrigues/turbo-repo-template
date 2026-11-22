/**
 * Everything the page says about the product in one place: rename it here. `SITE_URL` (where the page is served) and
 * `NEXT_PUBLIC_APP_URL` (where the web app is) are read at build time.
 */
export const site = {
  name: 'App',
  title: 'App: start the product, not the plumbing',
  description:
    'Accounts, sessions, preferences and a design system that are already done, so the first day goes to what makes your product different.',
  url: (process.env.SITE_URL ?? 'http://localhost:3502').replace(/\/+$/, ''),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3501').replace(/\/+$/, ''),
} as const

/** The sections of the page, in order: the header links and the anchors read from here. */
export const sections = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
] as const
