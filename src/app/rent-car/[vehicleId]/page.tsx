import { Suspense } from 'react'
import Header from '../../../components/Header'
import VehicleDetailClient from './VehicleDetailClient'

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
