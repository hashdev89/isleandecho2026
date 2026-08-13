import type { MetadataRoute } from 'next'
import { getSiteSeo, absoluteUrl } from '@/lib/siteSeo'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await getSiteSeo()
  return {
    name: seo.siteName,
    short_name: seo.siteName,
    description: seo.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F4EE',
    theme_color: '#0B3D4A',
    icons: [
      {
        src: absoluteUrl(seo.siteUrl, seo.faviconUrl || seo.logoUrl || '/logoisle&echo.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: absoluteUrl(seo.siteUrl, seo.logoUrl || '/logoisle&echo.png'),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
