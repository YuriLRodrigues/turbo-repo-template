import type { ReactNode } from 'react'

import type { Metadata, Viewport } from 'next'

import { pageMetadata } from '@/i18n/metadata'

import { RootDocument } from '../root-document'

import '../globals.css'

/*
 * The root layout of the default language, Brazilian Portuguese, served at the root of the site (no prefix). The other
 * languages have their own root layout in `app/(intl)/[lang]`, so each page is exported with its own <html lang>.
 */

export const metadata: Metadata = pageMetadata('pt')

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

const PortugueseLayout = ({ children }: { children: ReactNode }) => <RootDocument lang="pt">{children}</RootDocument>

export default PortugueseLayout
