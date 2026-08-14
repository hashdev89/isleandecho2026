import { NextRequest, NextResponse } from 'next/server'
import { syncInboundFromResend } from '@/lib/emailCenter'
import { requireDashboardSection } from '@/lib/adminAuth'

/** Pull received emails from Resend into the dashboard inbox */
export async function POST(request: NextRequest) {
  const denied = await requireDashboardSection(request, 'email')
  if (denied) return denied

  try {
    const result = await syncInboundFromResend(50)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Email sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync inbox from Resend',
      },
      { status: 500 }
    )
  }
}
