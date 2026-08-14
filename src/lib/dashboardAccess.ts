import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'
import { isSuperAdmin, normalizeRole, type AppRole } from '@/lib/roles'

export type DashboardSectionId =
  | 'dashboard'
  | 'chat'
  | 'email'
  | 'blog'
  | 'bookings'
  | 'images'
  | 'tours'
  | 'vehicles'
  | 'rental-settings'
  | 'destinations'
  | 'users'
  | 'analytics'
  | 'seo'
  | 'site-content'
  | 'settings'
  | 'access-control'

export type AssignableDashboardRole = Exclude<AppRole, 'super_admin'>

export type DashboardAccessMatrix = Record<DashboardSectionId, AssignableDashboardRole[]>

export type DashboardSectionDef = {
  id: DashboardSectionId
  name: string
  href: string
  description: string
}

const JSON_KEY = 'dashboard-access.json'
const LOCAL_FILE = path.join(process.cwd(), 'data', 'dashboard-access.json')

export const ASSIGNABLE_DASHBOARD_ROLES: AssignableDashboardRole[] = ['admin', 'staff', 'customer']

export const DASHBOARD_SECTIONS: DashboardSectionDef[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/admin', description: 'Overview, stats, and quick actions' },
  { id: 'chat', name: 'Chat', href: '/admin/chat', description: 'Live customer chat inbox' },
  { id: 'email', name: 'Email', href: '/admin/email', description: 'Email Center inbox, compose, and accounts' },
  { id: 'blog', name: 'Blog Posts', href: '/admin/blog', description: 'Create and edit blog posts' },
  { id: 'bookings', name: 'Bookings', href: '/admin/bookings', description: 'Tour, trip, and rental bookings' },
  { id: 'images', name: 'Images', href: '/admin/images', description: 'Media library uploads' },
  { id: 'tours', name: 'Tours', href: '/admin/tours', description: 'Tour packages and itineraries' },
  { id: 'vehicles', name: 'Vehicles', href: '/admin/vehicles', description: 'Rent-a-car fleet' },
  { id: 'rental-settings', name: 'Rental settings', href: '/admin/rental-settings', description: 'Rental pricing and rules' },
  { id: 'destinations', name: 'Destinations', href: '/admin/destinations', description: 'Destination pages and map data' },
  { id: 'users', name: 'Users', href: '/admin/users', description: 'Staff, admin, and customer accounts' },
  { id: 'analytics', name: 'Analytics', href: '/admin/analytics', description: 'Traffic and booking analytics' },
  { id: 'seo', name: 'SEO', href: '/admin/seo', description: 'Search keywords and meta tools' },
  { id: 'site-content', name: 'Site Content', href: '/admin/site-content', description: 'Homepage and CMS sections' },
  { id: 'settings', name: 'Settings', href: '/admin/settings', description: 'Site, payment, and SEO settings' },
  { id: 'access-control', name: 'Access control', href: '/admin/access', description: 'Who can see each dashboard section (Super Admin only)' },
]

export const DEFAULT_DASHBOARD_ACCESS: DashboardAccessMatrix = {
  dashboard: ['admin'],
  chat: ['admin', 'staff'],
  email: [],
  blog: ['admin', 'staff'],
  bookings: ['admin', 'staff', 'customer'],
  images: ['admin', 'staff'],
  tours: ['admin', 'staff'],
  vehicles: ['admin', 'staff'],
  'rental-settings': ['admin', 'staff'],
  destinations: ['admin', 'staff'],
  users: ['admin'],
  analytics: ['admin'],
  seo: ['admin'],
  'site-content': ['admin'],
  settings: ['admin'],
  'access-control': [],
}

function isAssignableRole(value: string): value is AssignableDashboardRole {
  return ASSIGNABLE_DASHBOARD_ROLES.includes(value as AssignableDashboardRole)
}

function isSectionId(value: string): value is DashboardSectionId {
  return DASHBOARD_SECTIONS.some((section) => section.id === value)
}

export function emptyDashboardAccess(): DashboardAccessMatrix {
  return Object.fromEntries(
    DASHBOARD_SECTIONS.map((section) => [section.id, [...(DEFAULT_DASHBOARD_ACCESS[section.id] || [])]])
  ) as DashboardAccessMatrix
}

export function normalizeDashboardAccess(input?: Partial<Record<string, string[]>> | null): DashboardAccessMatrix {
  const next = emptyDashboardAccess()
  if (!input || typeof input !== 'object') return next

  for (const section of DASHBOARD_SECTIONS) {
    const raw = input[section.id]
    if (!Array.isArray(raw)) continue
    const roles = Array.from(
      new Set(
        raw
          .map((role) => normalizeRole(role))
          .filter((role): role is AssignableDashboardRole => isAssignableRole(role))
      )
    )
    next[section.id] = section.id === 'access-control' ? [] : roles
  }
  return next
}

export function roleCanAccessSection(
  role: string | null | undefined,
  sectionId: DashboardSectionId,
  matrix: DashboardAccessMatrix = DEFAULT_DASHBOARD_ACCESS
) {
  if (isSuperAdmin(role)) return true
  if (sectionId === 'access-control') return false
  const allowed = matrix[sectionId] || DEFAULT_DASHBOARD_ACCESS[sectionId] || []
  return allowed.includes(normalizeRole(role) as AssignableDashboardRole)
}

export function sectionIdFromPathname(pathname?: string | null): DashboardSectionId | null {
  const path = String(pathname || '').split('?')[0]
  if (!path.startsWith('/admin')) return null
  if (path === '/admin' || path === '/admin/') return 'dashboard'
  if (path.startsWith('/admin/email')) return 'email'
  if (path.startsWith('/admin/chat')) return 'chat'
  if (path.startsWith('/admin/blog')) return 'blog'
  if (path.startsWith('/admin/bookings')) return 'bookings'
  if (path.startsWith('/admin/images')) return 'images'
  if (path.startsWith('/admin/tours')) return 'tours'
  if (path.startsWith('/admin/vehicles')) return 'vehicles'
  if (path.startsWith('/admin/rental-settings')) return 'rental-settings'
  if (path.startsWith('/admin/destinations')) return 'destinations'
  if (path.startsWith('/admin/users')) return 'users'
  if (path.startsWith('/admin/analytics')) return 'analytics'
  if (path.startsWith('/admin/seo')) return 'seo'
  if (path.startsWith('/admin/site-content')) return 'site-content'
  if (path.startsWith('/admin/settings')) return 'settings'
  if (path.startsWith('/admin/access')) return 'access-control'
  return null
}

export function firstAllowedDashboardHref(role: string | null | undefined, matrix: DashboardAccessMatrix) {
  const match = DASHBOARD_SECTIONS.find((section) => roleCanAccessSection(role, section.id, matrix))
  return match?.href || '/'
}

function hasSupabaseSettings() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

function readLocalMatrix(): DashboardAccessMatrix | null {
  try {
    if (!fs.existsSync(LOCAL_FILE)) return null
    return normalizeDashboardAccess(JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')))
  } catch {
    return null
  }
}

function writeLocalMatrix(matrix: DashboardAccessMatrix) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true })
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(matrix, null, 2))
    return true
  } catch (error) {
    console.error('writeLocalMatrix:', error)
    return false
  }
}

export async function loadDashboardAccessMatrix(): Promise<DashboardAccessMatrix> {
  if (hasSupabaseSettings()) {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('dashboard_access')
        .eq('id', 'main')
        .maybeSingle()
      if (!error && data?.dashboard_access && typeof data.dashboard_access === 'object') {
        return normalizeDashboardAccess(data.dashboard_access as Record<string, string[]>)
      }
    } catch (error) {
      console.error('loadDashboardAccessMatrix settings:', error)
    }
  }

  const stored = await loadAppJson<Record<string, string[]>>(JSON_KEY)
  if (stored) return normalizeDashboardAccess(stored)

  return readLocalMatrix() || emptyDashboardAccess()
}

export async function saveDashboardAccessMatrix(input: Partial<Record<string, string[]>>) {
  const matrix = normalizeDashboardAccess(input)
  let saved = false

  if (hasSupabaseSettings()) {
    try {
      const { error } = await supabaseAdmin.from('settings').upsert(
        {
          id: 'main',
          dashboard_access: matrix,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      if (!error) saved = true
      else if (!/dashboard_access/i.test(error.message || '')) {
        console.error('saveDashboardAccessMatrix settings:', error.message)
      }
    } catch (error) {
      console.error('saveDashboardAccessMatrix settings:', error)
    }
  }

  if (await saveAppJson(JSON_KEY, matrix)) saved = true
  if (!saved) saved = writeLocalMatrix(matrix)
  return { saved, matrix }
}

export function isDashboardSectionId(value: string): value is DashboardSectionId {
  return isSectionId(value)
}
