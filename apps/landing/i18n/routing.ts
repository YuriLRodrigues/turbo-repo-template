import { defaultLocale, localeMeta, type Locale, locales, prefixedLocales } from './config'

/**
 * The public path of a page in a language: `/` in pt, `/en/` in en. The export writes trailing slashes, so paths end
 * with one. Anchors are kept (`/#faq` → `/en/#faq`).
 */
export const localePath = (locale: Locale, path = '/'): string => {
  const [pathname, hash] = path.split('#')
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`
  const prefixed = locale === defaultLocale ? withSlash : `/${locale}${withSlash === '/' ? '/' : withSlash}`

  return hash === undefined ? prefixed : `${prefixed}#${hash}`
}

const prefix = new RegExp(`^/(${prefixedLocales.join('|')})(?=/|$)`)

/** The path without its language prefix: `/en/` → `/`, `/es/terms/` → `/terms/`. */
export const stripLocale = (pathname: string): string => {
  const match = prefix.exec(pathname)

  return match ? pathname.slice(match[0].length) || '/' : pathname
}

/** The language of a public path, from its prefix (the default when there is none). */
export const localeOf = (pathname: string): Locale => {
  const match = prefix.exec(pathname)

  return match ? (match[1] as Locale) : defaultLocale
}

/** The `alternates` of the metadata: the canonical URL of this language and hreflang for all (x-default: pt). */
export const localeAlternates = (locale: Locale, path = '/') => ({
  canonical: localePath(locale, path),
  languages: {
    ...Object.fromEntries(locales.map((each) => [localeMeta[each].htmlLang, localePath(each, path)])),
    'x-default': localePath(defaultLocale, path),
  },
})
