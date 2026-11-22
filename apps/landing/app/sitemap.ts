import type { MetadataRoute } from 'next'

import { site } from '@/config/site'

// A static export writes this file at build time.
export const dynamic = 'force-static'

/** One page today. A new page of the site adds its line. */
const sitemap = (): MetadataRoute.Sitemap => [{ url: `${site.url}/`, changeFrequency: 'monthly', priority: 1 }]

export default sitemap
