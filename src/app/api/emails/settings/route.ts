import { NextRequest, NextResponse } from 'next/server'
import {
  getEmailCenterSettings,
  saveEmailCenterSettings,
  type EmailCenterSettings,
} from '@/lib/emailCenter'
import { requireSuperAdminSession } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const denied = await requireSuperAdminSession(request)
  if (denied) return denied

  try {
    const settings = await getEmailCenterSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireSuperAdminSession(request)
  if (denied) return denied

  try {
    const body = (await request.json()) as EmailCenterSettings
    const settings: EmailCenterSettings = {
      accounts: Array.isArray(body.accounts)
        ? body.accounts.map((a) => ({
            ...a,
            email: a.email?.trim().toLowerCase() || '',
            assignedUserIds: Array.isArray(a.assignedUserIds) ? a.assignedUserIds : [],
            backupEmail: a.backupEmail?.trim().toLowerCase() || '',
            forwardInbound: Boolean(a.forwardInbound),
            forwardOutbound: Boolean(a.forwardOutbound),
          }))
        : [],
      resendWebhookSecret: body.resendWebhookSecret,
    }
    await saveEmailCenterSettings(settings)
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    )
  }
}
