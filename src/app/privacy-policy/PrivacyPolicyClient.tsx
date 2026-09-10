'use client'

import Header from '../../components/Header'
import CmsPageSections from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'

export default function PrivacyPolicyClient() {
  const { page, loading } = useCmsPage('/privacy-policy')

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-[var(--ink-soft)]">Loading…</div>
      ) : (
        <div className="privacy-page pb-16 sm:pb-24">
          <CmsPageSections page={page} />
        </div>
      )}
    </div>
  )
}
