import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('rent car', '/rent-car', 'Rent a car', 'Self-drive and chauffeur car hire across Sri Lanka with ISLE & ECHO.')
}

export default function RentCarLayout({ children }: { children: React.ReactNode }) {
  return children
}
