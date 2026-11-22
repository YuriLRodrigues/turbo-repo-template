import type { Metadata } from 'next'

import { NotFoundContent } from '@/components/not-found-content'
import { site } from '@/config/site'
import { defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

import { RootDocument } from './root-document'

import './globals.css'

/*
 * The 404 of any address the site does not have (`experimental.globalNotFound` in next.config.ts): with one root layout
 * per language there is no single layout to compose it from, so it is a whole document of its own. It starts in the
 * default language and switches in the browser (see NotFoundContent).
 */

export const metadata: Metadata = {
  title: `${getDictionary(defaultLocale).notFound.title} · ${site.name}`,
}

const GlobalNotFound = () => (
  <RootDocument lang={defaultLocale}>
    <NotFoundContent />
  </RootDocument>
)

export default GlobalNotFound
