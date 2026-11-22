import type { Metadata } from 'next'

import { shareImageSize } from '@/components/share-image'
import { site } from '@/config/site'

import { defaultLocale, localeMeta, type Locale, locales } from './config'
import { getDictionary } from './dictionaries'
import { localeAlternates, localePath } from './routing'

/** The title of the page in a language: the name of the product and its line (`App: start the product…`). */
export const pageTitle = (locale: Locale) => `${site.name}: ${getDictionary(locale).meta.tagline}`

/**
 * The basic SEO of the page in one language: title and description from the dictionary, the canonical URL of this
 * language with hreflang for all of them (x-default: pt), Open Graph with its `og:locale` (the others as alternates)
 * and the card of social networks, with the share image of the language (`share.png`, written by the Route Handler
 * next to each root layout) and its alt from the dictionary. `path` is the page without the language prefix.
 */
export const pageMetadata = (locale: Locale, path = '/'): Metadata => {
  const { meta } = getDictionary(locale)
  const title = pageTitle(locale)
  const image = {
    url: locale === defaultLocale ? '/share.png' : `/${locale}/share.png`,
    width: shareImageSize.width,
    height: shareImageSize.height,
    type: 'image/png',
    alt: meta.ogImageAlt,
  }

  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s · ${site.name}` },
    description: meta.description,
    applicationName: site.name,
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: 'website',
      url: localePath(locale, path),
      siteName: site.name,
      title,
      description: meta.description,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((each) => each !== locale).map((each) => localeMeta[each].ogLocale),
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description: meta.description, images: [image] },
    robots: { index: true, follow: true },
  }
}
