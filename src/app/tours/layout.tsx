import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('tours', '/tours', 'Tour packages', 'Browse curated Sri Lanka tour packages with ISLE & ECHO.')
}

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return children
}
