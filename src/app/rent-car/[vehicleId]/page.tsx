import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '../../../components/Header'
import VehicleDetailClient from './VehicleDetailClient'
import { loadVehicles } from '@/lib/vehiclesData'
import { buildPageMetadata, getSiteSeo } from '@/lib/siteSeo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicleId: string }>
}): Promise<Metadata> {
  const { vehicleId } = await params
  const seo = await getSiteSeo()
  const vehicles = await loadVehicles().catch(() => [])
  const vehicle = vehicles.find((v) => v.id === vehicleId)
  return buildPageMetadata(seo, {
    title: vehicle?.name || 'Vehicle',
    description: vehicle?.description || 'Rent a car in Sri Lanka with ISLE & ECHO.',
    path: `/rent-car/${vehicleId}`,
    image: vehicle?.images?.[0],
  })
}

export default function VehicleDetailPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sand)]">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh] text-[var(--ink-soft)]">
            Loading vehicle…
          </div>
        </div>
      }
    >
      <VehicleDetailClient params={params} />
    </Suspense>
  )
}
