import { Suspense } from 'react'
import Header from '../../../components/Header'
import TourPackageClient from './TourPackageClient'

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
