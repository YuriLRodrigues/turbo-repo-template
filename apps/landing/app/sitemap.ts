import type { MetadataRoute } from 'next'

import { site } from '@/config/site'
import { defaultLocale, localeMeta, locales } from '@/i18n/config'
import { localePath } from '@/i18n/routing'

// A static export writes this file at build time.
export const dynamic = 'force-static'

/** The pages of the site, without the language prefix. A new page adds its path here. */
const PAGES = ['/']

/**
 * Every page in every language, each one with the addresses of the others (hreflang, x-default: the default language).
 * The default language comes first and weighs more.
 */
const sitemap = (): MetadataRoute.Sitemap =>
  PAGES.flatMap((page) => {
    const languages = {
      ...Object.fromEntries(
        locales.map((locale) => [localeMeta[locale].htmlLang, site.url + localePath(locale, page)]),
      ),
      'x-default': site.url + localePath(defaultLocale, page),
    }

    return locales.map((locale) => ({
      url: site.url + localePath(locale, page),
      changeFrequency: 'monthly' as const,
      priority: locale === defaultLocale ? 1 : 0.8,
      alternates: { languages },
    }))
  })

export default sitemap
