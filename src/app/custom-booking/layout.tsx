import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata(
    'custom booking',
    '/custom-booking',
    'Plan your trip',
    'Build a custom Sri Lanka itinerary with ISLE & ECHO.'
  )
}

export default function CustomBookingLayout({ children }: { children: React.ReactNode }) {
  return children
}
