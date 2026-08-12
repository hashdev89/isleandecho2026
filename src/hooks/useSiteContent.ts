'use client'

import { useEffect, useState } from 'react'
import {
  getPageBySlug,
  normalizeSiteContent,
  type CmsPage,
  type SiteContentDoc,
} from '@/lib/siteContent'

export function useSiteContent() {
  const [doc, setDoc] = useState<SiteContentDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/site-content', { cache: 'force-cache' })
        const json = await res.json()
        if (!cancelled && json.success && json.data) {
          setDoc(normalizeSiteContent(json.data))
        }
      } catch (e) {
        console.error('Failed to load site content', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { doc, loading }
}

export function useCmsPage(slug: string): { page: CmsPage | undefined; doc: SiteContentDoc | null; loading: boolean } {
  const { doc, loading } = useSiteContent()
  return { page: doc ? getPageBySlug(doc, slug) : undefined, doc, loading }
}
