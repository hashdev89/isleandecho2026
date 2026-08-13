import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('blog', '/blog', 'Travel stories', 'Sri Lanka travel stories, tips, and inspiration from ISLE & ECHO.')
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
