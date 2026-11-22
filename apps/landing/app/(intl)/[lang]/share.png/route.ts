import { shareImage } from '@/components/share-image'
import { prefixedLocales } from '@/i18n/config'
import { resolveLocale } from '@/i18n/params'

// A static export writes these files at build time: `out/en/share.png`, `out/es/share.png`.
export const dynamic = 'force-static'
export const dynamicParams = false

// A Route Handler is not wrapped by the layout: it lists the languages itself.
export const generateStaticParams = () => prefixedLocales.map((lang) => ({ lang }))

/** The share image of `/en/` and `/es/`, in the language of the prefix (its URL and its alt: `i18n/metadata.ts`). */
export const GET = async (_request: Request, { params }: RouteContext<'/[lang]/share.png'>) =>
  shareImage(await resolveLocale(params))
