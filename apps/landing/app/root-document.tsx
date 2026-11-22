import type { ReactNode } from 'react'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { BOOT_SCRIPT } from '@workspace/ui/lib/boot-script'

import { type Locale, localeMeta } from '@/i18n/config'

/**
 * The <html> of every root layout: the `lang` of the language, the fonts and the script that writes the appearance
 * before the first paint. Each language group (`app/(pt)`, `app/(intl)/[lang]`) is its own root layout, so each page
 * is exported with the right `lang` already in the HTML.
 */
export const RootDocument = ({ lang, children }: { lang: Locale; children: ReactNode }) => (
  // The head script writes data-* attributes on <html> before hydration, hence `suppressHydrationWarning`.
  <html
    lang={localeMeta[lang].htmlLang}
    className={`${GeistSans.variable} ${GeistMono.variable}`}
    suppressHydrationWarning
  >
    <head>
      {/* The look the person chose in the app (same design system, same storage key) before the first paint. */}
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </head>
    <body>{children}</body>
  </html>
)
