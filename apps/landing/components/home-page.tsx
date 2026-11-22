import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

import { Closing, Faq, Features, Hero, HowItWorks } from './sections'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

/**
 * The product page in one language: a promise, what it does, how to start, the usual questions and the call to start.
 * Both routes render it: `app/(pt)/page.tsx` (`/`) and `app/(intl)/[lang]/page.tsx` (`/en/`, `/es/`).
 */
export const HomePage = ({ lang }: { lang: Locale }) => {
  const dict = getDictionary(lang)

  return (
    <>
      <SiteHeader lang={lang} />
      <main>
        <Hero dict={dict} />
        <Features dict={dict} />
        <HowItWorks dict={dict} />
        <Faq dict={dict} />
        <Closing dict={dict} />
      </main>
      <SiteFooter lang={lang} />
    </>
  )
}
