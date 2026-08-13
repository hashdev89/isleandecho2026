import type { MetadataRoute } from 'next'
import { getSiteSeo } from '@/lib/siteSeo'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSiteSeo()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/', '/payments/'],
    },
    sitemap: `${seo.siteUrl}/sitemap.xml`,
    host: seo.siteUrl,
  }
}
