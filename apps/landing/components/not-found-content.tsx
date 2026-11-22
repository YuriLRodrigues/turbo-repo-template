'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { Button } from '@workspace/ui/components/button'

import { site } from '@/config/site'
import { defaultLocale, localeMeta } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { localeOf, localePath } from '@/i18n/routing'

const noSubscription = () => () => {}

/**
 * The 404 is one file for the whole site (`out/404.html`), so the build cannot know the language of the address that
 * missed. It is exported in the default language and, in the browser, reads the prefix of the address (`/en/…`,
 * `/es/…`) and speaks that language: the words, the `lang` of <html> and the title of the tab.
 */
export const NotFoundContent = () => {
  const locale = useSyncExternalStore(
    noSubscription,
    () => localeOf(window.location.pathname),
    () => defaultLocale,
  )
  const { notFound } = getDictionary(locale)

  useEffect(() => {
    document.documentElement.lang = localeMeta[locale].htmlLang
    document.title = `${notFound.title} · ${site.name}`
  }, [locale, notFound.title])

  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="font-display text-2xl font-semibold">{notFound.title}</h1>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">{notFound.text}</p>
        <Button render={<a href={localePath(locale)} />} className="mt-2">
          {notFound.back}
        </Button>
      </div>
    </main>
  )
}
