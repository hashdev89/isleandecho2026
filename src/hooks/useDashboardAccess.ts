'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  DEFAULT_DASHBOARD_ACCESS,
  firstAllowedDashboardHref,
  roleCanAccessSection,
  sectionIdFromPathname,
  type DashboardAccessMatrix,
  type DashboardSectionId,
} from '@/lib/dashboardAccess'
import { isSuperAdmin } from '@/lib/roles'

function authHeaders(user: { id?: string; name?: string; role?: string } | null) {
  const headers: HeadersInit = {}
  if (user?.id) headers['x-user-id'] = user.id
  if (user?.name) headers['x-user-name'] = user.name
  if (user?.role) headers['x-user-role'] = user.role
  return headers
}

export function useDashboardAccess() {
  const { user } = useAuth()
  const [matrix, setMatrix] = useState<DashboardAccessMatrix>(DEFAULT_DASHBOARD_ACCESS)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-access', {
        credentials: 'include',
        headers: authHeaders(user),
        cache: 'no-store',
      })
      const json = await res.json()
      if (json?.success && json.data?.matrix) {
        setMatrix(json.data.matrix)
      }
    } catch (error) {
      console.error('load dashboard access:', error)
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoaded(true)
      return
    }
    void refresh()
  }, [user, refresh])

  const canAccess = useCallback(
    (sectionId: DashboardSectionId) => roleCanAccessSection(user?.role, sectionId, matrix),
    [matrix, user?.role]
  )

  const firstAllowedHref = useMemo(
    () => firstAllowedDashboardHref(user?.role, matrix),
    [matrix, user?.role]
  )

  return {
    matrix,
    loaded,
    canAccess,
    firstAllowedHref,
    isSuperAdmin: isSuperAdmin(user?.role),
    sectionIdFromPathname,
    refresh,
    authHeaders: authHeaders(user),
  }
}
