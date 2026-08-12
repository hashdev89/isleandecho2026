import { Suspense } from 'react'
import Header from '../../components/Header'
import RentCarClient from './RentCarClient'

export default function RentCarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sand)]">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh] text-[var(--ink-soft)]">
            Loading vehicles…
          </div>
        </div>
      }
    >
      <RentCarClient />
    </Suspense>
  )
}
