import { NextRequest, NextResponse } from 'next/server'
import {
  emptyTrash,
  getAccessibleAccounts,
  getEmailCenterSettings,
  getEmailStats,
  listThreads,
  sendStaffEmail,
  type EmailFolder,
} from '@/lib/emailCenter'
import { requireDashboardSection, staffUserFromRequest } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const staff = staffUserFromRequest(request)
    const settings = await getEmailCenterSettings()
    const accessibleAccounts = getAccessibleAccounts(settings.accounts, staff.id, staff.role)
    const accessibleEmails = accessibleAccounts.map((a) => a.email)

    const { searchParams } = new URL(request.url)
    const folder = (searchParams.get('folder') || 'inbox') as EmailFolder | 'all' | 'unread'
    const search = searchParams.get('search') || ''
    const accountEmail = searchParams.get('account') || undefined

    if (accountEmail && !accessibleEmails.some((e) => e.toLowerCase() === accountEmail.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Access denied to this inbox' }, { status: 403 })
    }

    const [threads, stats] = await Promise.all([
      listThreads({ folder, search, accountEmail, accessibleEmails }),
      getEmailStats(accessibleEmails),
    ])

    return NextResponse.json({
      success: true,
      data: {
        threads,
        stats,
        accounts: accessibleAccounts,
      },
    })
  } catch (error) {
    console.error('Emails GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load emails' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const body = await request.json()
    const staff = staffUserFromRequest(request)

    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((item: { filename?: string; url?: string }) => item?.filename && item?.url)
          .map((item: { id?: string; filename: string; url: string; contentType?: string; size?: number }) => ({
            id: String(item.id || crypto.randomUUID()),
            filename: String(item.filename),
            url: String(item.url),
            contentType: item.contentType ? String(item.contentType) : undefined,
            size: item.size ? Number(item.size) : undefined,
          }))
      : undefined

    const result = await sendStaffEmail({
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: String(body.subject || '').trim(),
      bodyHtml: String(body.bodyHtml || body.body || '').trim(),
      bodyText: body.bodyText,
      fromAccountId: body.fromAccountId,
      threadId: body.threadId,
      inReplyTo: body.inReplyTo,
      references: body.references,
      attachments,
      sentByUserId: staff.id,
      sentByUserName: staff.name,
      userId: staff.id,
      userRole: staff.role,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Emails POST error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireSuperAdminSession(request)
  if (denied) return denied

  try {
    const staff = staffUserFromRequest(request)
    const settings = await getEmailCenterSettings()
    const accessibleEmails = getAccessibleAccounts(settings.accounts, staff.id, staff.role).map(
      (a) => a.email
    )
    const deleted = await emptyTrash(accessibleEmails)
    return NextResponse.json({ success: true, data: { deleted } })
  } catch (error) {
    console.error('Emails empty trash error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to empty trash' },
      { status: 500 }
    )
  }
}
