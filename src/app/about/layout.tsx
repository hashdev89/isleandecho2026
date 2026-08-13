import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('about', '/about', 'About us', 'Learn about ISLE & ECHO and our Sri Lanka travel experiences.')
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
