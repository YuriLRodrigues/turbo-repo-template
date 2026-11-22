import type { MetadataRoute } from 'next'

import { site } from '@/config/site'

// A static export writes this file at build time.
export const dynamic = 'force-static'

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/' },
  sitemap: `${site.url}/sitemap.xml`,
})

export default robots
