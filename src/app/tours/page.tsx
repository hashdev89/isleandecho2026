import { Suspense } from 'react'
import Header from '../../components/Header'
import ToursClient from './ToursClient'

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sand)]">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh] text-[var(--ink-soft)]">
            Loading tours…
          </div>
        </div>
      }
    >
      <ToursClient />
    </Suspense>
  )
}
