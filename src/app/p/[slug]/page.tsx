'use client'

import Header from '../../../components/Header'
import CmsPageSections from '../../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'
import { use } from 'react'
import { normalizeSlug } from '@/lib/siteContent'

const RESERVED = new Set([
  '/',
  '/about',
  '/contact',
  '/tours',
  '/rent-car',
  '/destinations',
  '/blog',
  '/custom-booking',
  '/admin',
])

export default function CustomCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const path = normalizeSlug(slug)
  const { page, loading } = useCmsPage(path)

  if (RESERVED.has(path)) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-[var(--ink)]">Use the built-in route</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            This page already has a dedicated URL at <code>{path}</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center text-[var(--ink-soft)]">Loading…</div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-[var(--ink)]">Page not found</h1>
          <p className="mt-2 text-[var(--ink-soft)]">Create this page in Admin → Site Content.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      <CmsPageSections page={page} />
    </div>
  )
}
