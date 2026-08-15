import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata('login', '/login', 'Sign in', 'Sign in to your ISLE & ECHO account.')
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
