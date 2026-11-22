/**
 * The languages of the page. Brazilian Portuguese is the default and lives at the root (no prefix); English and
 * Spanish live under /en and /es. A new language: add it here, write its dictionary, and add its flag
 * (docs/patterns/web/i18n.md).
 */
export const locales = ['pt', 'en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'pt'

/** The languages that have a prefix in the URL: every one but the default. */
export const prefixedLocales = locales.filter((locale) => locale !== defaultLocale)

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value)

/** Per language: the `lang` of <html>, the `og:locale`, the name in its own language and the short tag. */
export const localeMeta: Record<Locale, { htmlLang: string; ogLocale: string; label: string; short: string }> = {
  pt: { htmlLang: 'pt-BR', ogLocale: 'pt_BR', label: 'Português', short: 'PT-BR' },
  en: { htmlLang: 'en', ogLocale: 'en_US', label: 'English', short: 'EN' },
  es: { htmlLang: 'es', ogLocale: 'es_ES', label: 'Español', short: 'ES' },
}
