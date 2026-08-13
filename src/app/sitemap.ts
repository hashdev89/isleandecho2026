import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { getDestinationsForServer } from '@/lib/destinationsData'
import { loadVehicles } from '@/lib/vehiclesData'
import { loadAppJson } from '@/lib/supabaseJsonStore'
import { normalizeSiteContent } from '@/lib/siteContent'
import { getSiteSeo } from '@/lib/siteSeo'
import fs from 'fs'
import path from 'path'

function isActive(status?: string | null) {
  if (!status) return true
  const value = String(status).toLowerCase()
  return value === 'active' || value === 'published' || value === 'true'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSiteSeo()
  const baseUrl = seo.siteUrl
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/tours`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/rent-car`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/custom-booking`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  try {
    const { data: tours } = await supabaseAdmin.from('tours').select('id, updated_at, status')
    for (const tour of tours || []) {
      if (!isActive(tour.status) || !tour.id) continue
      entries.push({
        url: `${baseUrl}/tours/${tour.id}`,
        lastModified: tour.updated_at ? new Date(tour.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch (error) {
    console.error('sitemap tours:', error)
  }

  try {
    const destinations = await getDestinationsForServer()
    for (const dest of destinations) {
      if (!isActive(dest.status) || !dest.id) continue
      entries.push({
        url: `${baseUrl}/destinations/${dest.id}`,
        lastModified: dest.updated_at ? new Date(dest.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('sitemap destinations:', error)
  }

  try {
    const { data: posts } = await supabaseAdmin
      .from('blog')
      .select('id, slug, updated_at, status')
    for (const post of posts || []) {
      if (!isActive(post.status) || !(post.slug || post.id)) continue
      entries.push({
        url: `${baseUrl}/blog/${post.slug || post.id}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('sitemap blog:', error)
  }

  try {
    const vehicles = await loadVehicles()
    for (const vehicle of vehicles) {
      if (!isActive(vehicle.status) || !vehicle.id) continue
      entries.push({
        url: `${baseUrl}/rent-car/${vehicle.id}`,
        lastModified: vehicle.updatedAt ? new Date(vehicle.updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('sitemap vehicles:', error)
  }

  try {
    const raw =
      (await loadAppJson<Record<string, unknown>>('content.json')) ||
      (() => {
        try {
          const file = path.join(process.cwd(), 'data', 'site-content.json')
          if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
        } catch {
          /* ignore */
        }
        return null
      })()
    if (raw) {
      const doc = normalizeSiteContent(raw)
      for (const page of doc.pages) {
        if (!page.enabled || !page.isCustom || !page.slug) continue
        const slug = page.slug.startsWith('/') ? page.slug : `/${page.slug}`
        entries.push({
          url: `${baseUrl}/p${slug}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  } catch (error) {
    console.error('sitemap cms pages:', error)
  }

  return entries
}
