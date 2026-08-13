import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdminSession } from '@/lib/adminAuth'
import {
  MAX_EMAIL_ATTACHMENT_BYTES,
  storeEmailAttachment,
} from '@/lib/emailAttachments'

export async function POST(request: NextRequest) {
  const denied = await requireSuperAdminSession(request)
  if (denied) return denied

  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    if (file.size > MAX_EMAIL_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { success: false, error: `${file.name} is larger than 4MB` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await storeEmailAttachment(file.name, buffer, file.type || undefined)
    return NextResponse.json({ success: true, data: stored })
  } catch (error) {
    console.error('Email attachment upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
