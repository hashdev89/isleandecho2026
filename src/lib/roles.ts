export type AppRole = 'super_admin' | 'admin' | 'staff' | 'customer'

export function normalizeRole(role?: string | null): AppRole | string {
  return String(role || '').trim().toLowerCase()
}

export function isSuperAdmin(role?: string | null) {
  return normalizeRole(role) === 'super_admin'
}

export function hasAdminAccess(role?: string | null) {
  const value = normalizeRole(role)
  return value === 'super_admin' || value === 'admin'
}

export function hasStaffAccess(role?: string | null) {
  return hasAdminAccess(role) || normalizeRole(role) === 'staff'
}

export function hasDashboardAccess(role?: string | null) {
  const value = normalizeRole(role)
  return value === 'super_admin' || value === 'admin' || value === 'staff' || value === 'customer'
}

export function canAccessEmailCenter(role?: string | null) {
  return isSuperAdmin(role)
}

/** Only super admins can see, create, or assign the Super Admin role. */
export function canManageSuperAdmins(role?: string | null) {
  return isSuperAdmin(role)
}

export function roleLabel(role?: string | null) {
  const value = normalizeRole(role)
  if (value === 'super_admin') return 'Super Admin'
  if (value === 'admin') return 'Admin'
  if (value === 'staff') return 'Staff'
  if (value === 'customer') return 'Customer'
  return value || 'User'
}
