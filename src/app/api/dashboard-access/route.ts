import { NextRequest, NextResponse } from 'next/server'
import { requireStaffSession, requireSuperAdminSession } from '@/lib/adminAuth'
import {
  ASSIGNABLE_DASHBOARD_ROLES,
  DASHBOARD_SECTIONS,
  DEFAULT_DASHBOARD_ACCESS,
} from '@/lib/dashboardAccess'
import { loadDashboardAccessMatrix, saveDashboardAccessMatrix } from '@/lib/dashboardAccessStore'

export async function GET() {
  const denied = await requireStaffSession()
  if (denied) return denied

  try {
    const matrix = await loadDashboardAccessMatrix()
    return NextResponse.json({
      success: true,
      data: {
        matrix,
        sections: DASHBOARD_SECTIONS,
        assignableRoles: ASSIGNABLE_DASHBOARD_ROLES,
        defaults: DEFAULT_DASHBOARD_ACCESS,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load access settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireSuperAdminSession(request)
  if (denied) return denied

  try {
    const body = await request.json()
    const input = body.matrix || body
    const { saved, matrix } = await saveDashboardAccessMatrix(input)
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Failed to save access settings' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: { matrix } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save access settings' },
      { status: 500 }
    )
  }
}
