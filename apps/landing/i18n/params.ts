import { notFound } from 'next/navigation'

import { defaultLocale, isLocale, type Locale } from './config'

/**
 * The language of the `[lang]` segment, or the 404. The default language never has a prefix: `/pt/` does not exist,
 * its page is `/`.
 */
export const resolveLocale = async (params: Promise<{ lang: string }>): Promise<Locale> => {
  const { lang } = await params
  if (!isLocale(lang) || lang === defaultLocale) notFound()

  return lang
}
