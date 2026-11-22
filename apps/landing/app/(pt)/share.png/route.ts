import { shareImage } from '@/components/share-image'

// A static export writes this file at build time: `out/share.png`.
export const dynamic = 'force-static'

/** The share image of `/`, in Brazilian Portuguese (its URL and its alt are in `i18n/metadata.ts`). */
export const GET = () => shareImage('pt')
