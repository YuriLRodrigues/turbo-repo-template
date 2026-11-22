import type { ReactNode } from 'react'

import type { Metadata, Viewport } from 'next'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { Toaster } from '@workspace/ui/components/toast'
import { BOOT_SCRIPT } from '@workspace/ui/lib/boot-script'

import { AppProviders } from '@/components/providers/app-providers'
import { siteConfig } from '@/config/site'

import './globals.css'

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The page paints under the notch and the home indicator; the shell adds the safe-area insets back.
  viewportFit: 'cover',
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  // The head script writes data-* attributes on <html> before hydration, hence `suppressHydrationWarning`.
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
    <head>
      {/* Before the first paint: the look (theme, accent, density, motion) and the sidebar (open or closed) from the
          last visit. Nothing flashes and nothing animates on load. */}
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </head>
    <body>
      <AppProviders>{children}</AppProviders>
      <Toaster />
    </body>
  </html>
)

export default RootLayout
