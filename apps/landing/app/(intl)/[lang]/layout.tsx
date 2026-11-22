import type { Metadata, Viewport } from 'next'

import { prefixedLocales } from '@/i18n/config'
import { pageMetadata } from '@/i18n/metadata'
import { resolveLocale } from '@/i18n/params'

import { RootDocument } from '../../root-document'

import '../../globals.css'

/*
 * The root layout of the languages with a prefix: `/en/` and `/es/`. The list comes from `i18n/config.ts`; any other
 * prefix is not exported (`dynamicParams = false`) and answers the 404 of `app/global-not-found.tsx`.
 */

export const dynamicParams = false

export const generateStaticParams = () => prefixedLocales.map((lang) => ({ lang }))

export const generateMetadata = async ({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> =>
  pageMetadata(await resolveLocale(params))

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

const LocaleLayout = async ({ params, children }: LayoutProps<'/[lang]'>) => (
  <RootDocument lang={await resolveLocale(params)}>{children}</RootDocument>
)

export default LocaleLayout
