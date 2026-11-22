import type { ReactNode } from 'react'

import type { Metadata, Viewport } from 'next'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { BOOT_SCRIPT } from '@workspace/ui/lib/boot-script'

import { site } from '@/config/site'

import './globals.css'

/** The basic SEO of a product page: title, description, canonical URL, Open Graph and the card of social networks. */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  // The head script writes data-* attributes on <html> before hydration, hence `suppressHydrationWarning`.
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
    <head>
      {/* The look the person chose in the app (same design system, same storage key) before the first paint. */}
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </head>
    <body>{children}</body>
  </html>
)

export default RootLayout
