import { NextRequest, NextResponse } from 'next/server'
import {
  canAccessThread,
  getEmailCenterSettings,
  getThreadWithMessages,
  markThreadRead,
  markThreadUnread,
  permanentlyDeleteThread,
  restoreThread,
  updateThread,
} from '@/lib/emailCenter'
import { requireDashboardSection, staffUserFromRequest } from '@/lib/adminAuth'

async function assertThreadAccess(request: NextRequest, threadId: string) {
  const staff = staffUserFromRequest(request)
  const settings = await getEmailCenterSettings()
  const data = await getThreadWithMessages(threadId)
  if (!data) return { error: NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 }) }
  if (!canAccessThread(data.thread, settings.accounts, staff.id, staff.role)) {
    return { error: NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 }) }
  }
  return { data, staff }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const { id } = await params
    const access = await assertThreadAccess(request, id)
    if (access.error) return access.error

    await markThreadRead(id)
    const refreshed = await getThreadWithMessages(id)
    return NextResponse.json({ success: true, data: refreshed || access.data })
  } catch (error) {
    console.error('Email thread GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load thread' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const { id } = await params
    const access = await assertThreadAccess(request, id)
    if (access.error) return access.error

    const body = await request.json()
    if (body.restore) {
      const thread = await restoreThread(id)
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: thread })
    }

    if (body.unread === true) {
      const thread = await markThreadUnread(id)
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: thread })
    }

    if (body.read === true) {
      await markThreadRead(id)
      const refreshed = await getThreadWithMessages(id)
      return NextResponse.json({ success: true, data: refreshed?.thread || null })
    }

    const thread = await updateThread(id, {
      starred: body.starred,
      folder: body.folder,
      status: body.status,
    })
    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: thread })
  } catch (error) {
    console.error('Email thread PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update thread' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const { id } = await params
    const access = await assertThreadAccess(request, id)
    if (access.error) return access.error

    const ok = await permanentlyDeleteThread(id)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email thread DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete thread' },
      { status: 500 }
    )
  }
}
