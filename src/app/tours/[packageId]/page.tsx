import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '../../../components/Header'
import TourPackageClient from './TourPackageClient'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { buildPageMetadata, getSiteSeo } from '@/lib/siteSeo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ packageId: string }>
}): Promise<Metadata> {
  const { packageId } = await params
  const seo = await getSiteSeo()
  let title = 'Tour package'
  let description = 'Explore this Sri Lanka tour package with ISLE & ECHO.'
  let image: string | undefined
  try {
    const { data } = await supabaseAdmin
      .from('tours')
      .select('name, description, image, images')
      .eq('id', packageId)
      .maybeSingle()
    if (data) {
      title = String(data.name || title)
      description = String(data.description || description)
      const images = Array.isArray(data.images) ? data.images : []
      image = String(data.image || images[0] || '') || undefined
    }
  } catch {
    /* use defaults */
  }
  return buildPageMetadata(seo, {
    title,
    description,
    path: `/tours/${packageId}`,
    image,
  })
}

export default function TourPackagePage({ params }: { params: Promise<{ packageId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sand)]">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh] text-[var(--ink-soft)]">
            Loading tour…
          </div>
        </div>
      }
    >
      <TourPackageClient params={params} />
    </Suspense>
  )
}
