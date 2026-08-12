import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function requireStaffSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  if (session !== '1') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function staffUserFromRequest(request: NextRequest) {
  return {
    id: request.headers.get('x-user-id') || 'staff',
    name: request.headers.get('x-user-name') || 'Staff',
    role: request.headers.get('x-user-role') || 'admin',
  }
}

export async function requireAdminSession(request: NextRequest) {
  const denied = await requireStaffSession()
  if (denied) return denied
  const { role } = staffUserFromRequest(request)
  if (role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }
  return null
}
