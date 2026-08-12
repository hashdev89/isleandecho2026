import { NextRequest, NextResponse } from 'next/server'
import { notifyContactMessage } from '@/lib/emailService'
import { recordInboundEmail } from '@/lib/emailCenter'

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  booking: 'Booking Question',
  'custom-tour': 'Custom Tour Request',
  support: 'Customer Support',
  partnership: 'Partnership',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const subject = String(body.subject || '').trim()
    const message = String(body.message || '').trim()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    await recordInboundEmail({
      fromEmail: email,
      fromName: name,
      subject: `${SUBJECT_LABELS[subject] || subject} — ${name}`,
      bodyText: `Phone: ${phone || '—'}\n\n${message}`,
      bodyHtml: `<p><strong>Phone:</strong> ${phone || '—'}</p><p>${message.replace(/\n/g, '<br>')}</p>`,
    }).catch((err) => console.error('Inbox record failed:', err))

    await notifyContactMessage({
      name,
      email,
      phone,
      subject,
      subjectLabel: SUBJECT_LABELS[subject] || subject,
      message,
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent. We will get back to you shortly.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    const detail = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json(
      { success: false, error: detail },
      { status: 500 }
    )
  }
}
