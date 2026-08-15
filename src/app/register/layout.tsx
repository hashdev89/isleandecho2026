import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/siteSeo'

export async function generateMetadata(): Promise<Metadata> {
  return buildRouteMetadata(
    'register',
    '/register',
    'Create account',
    'Create your ISLE & ECHO account to book tours and manage trips.'
  )
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
