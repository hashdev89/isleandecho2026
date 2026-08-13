import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('contact', '/contact', 'Contact us', 'Get in touch with ISLE & ECHO to plan your Sri Lanka trip.')
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
