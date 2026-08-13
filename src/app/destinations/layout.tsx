import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata(
    'destinations',
    '/destinations',
    'Destinations',
    'Explore Sri Lanka destinations — beaches, highlands, wildlife, and cultural sites.'
  )
}

export default function DestinationsLayout({ children }: { children: React.ReactNode }) {
  return children
}
