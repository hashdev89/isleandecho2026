'use client'

import Header from '../../components/Header'
import CmsPageSections from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function AboutPage() {
  const { page, doc } = useCmsPage('/about')
  const footer = (doc?.footer || {}) as Record<string, unknown>
  const address = String(footer.contactAddress || '55/A, Kulupana, Pokunuwita, Sri Lanka')
  const phone = String(footer.contactPhone || '+94 741 415 812')
  const email = String(footer.contactEmail || 'info@isleandecho.com')

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      <CmsPageSections page={page} />

      <section className="bg-[var(--lagoon-deep)] py-14 text-white sm:py-16">
        <div className="mx-auto w-full max-w-[1920px] lp-gutter">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-center space-x-4">
              <MapPin className="h-6 w-6 shrink-0 text-[var(--sun)]" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="text-white/75">{address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-6 w-6 shrink-0 text-[var(--sun)]" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-white/75">{phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 shrink-0 text-[var(--sun)]" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-white/75">{email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
