import { NextRequest, NextResponse } from 'next/server'
import { recordInboundEmail, getEmailCenterSettings } from '@/lib/emailCenter'

function parseFromHeader(raw: string): { email: string; name: string } {
  const trimmed = String(raw || '').trim()
  const match = trimmed.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/)
  const email = (match?.[2] || trimmed).trim().toLowerCase()
  const name = match?.[1]?.trim() || email
  return { email, name }
}

async function fetchReceivedEmail(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY || ''
  if (apiKey.length < 10) return null

  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    console.error('Resend receiving.get failed:', res.status, await res.text())
    return null
  }
  return res.json() as Promise<{
    from?: string
    to?: string[]
    subject?: string
    html?: string | null
    text?: string | null
    message_id?: string
    headers?: Record<string, string>
  }>
}

/** Resend inbound email webhook — configure in Resend dashboard → Webhooks → email.received */
export async function POST(request: NextRequest) {
  try {
    const settings = await getEmailCenterSettings()
    const secret = settings.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET
    if (secret) {
      const signature = request.headers.get('svix-signature') || request.headers.get('resend-signature')
      if (!signature) {
        return NextResponse.json({ success: false, error: 'Missing webhook signature' }, { status: 401 })
      }
      // Production: verify Svix signature with secret. Skipped in dev when secret not set.
    }

    const payload = await request.json()
    const type = payload.type || payload.event
    if (type && type !== 'email.received') {
      return NextResponse.json({ success: true, message: 'Ignored event type' })
    }

    const data = payload.data || payload
    const emailId = data.email_id || data.emailId

    let fromEmail = ''
    let fromName = ''
    let to: string[] = Array.isArray(data.to) ? data.to.map(String) : data.to ? [String(data.to)] : []
    let subject = data.subject || '(No subject)'
    let bodyHtml: string | undefined = data.html || data.body_html
    let bodyText: string | undefined = data.text || data.body_text
    let messageId: string | undefined = data.message_id || data.messageId

    // Resend webhooks only include metadata — fetch full body via Receiving API
    if (emailId) {
      const full = await fetchReceivedEmail(String(emailId))
      if (full) {
        const fromRaw = full.headers?.from || full.from || ''
        const parsed = parseFromHeader(fromRaw)
        fromEmail = parsed.email
        fromName = parsed.name
        to = full.to || to
        subject = full.subject || subject
        bodyHtml = full.html || bodyHtml
        bodyText = full.text || bodyText
        messageId = full.message_id || messageId
      }
    }

    if (!fromEmail) {
      const fromRaw = data.from || data.from_email || ''
      const parsed = parseFromHeader(String(fromRaw))
      fromEmail = parsed.email
      fromName = parsed.name
    }

    const result = await recordInboundEmail({
      fromEmail,
      fromName: fromName || fromEmail,
      to,
      subject: String(subject),
      bodyHtml,
      bodyText,
      messageId,
      resendEmailId: emailId ? String(emailId) : undefined,
      inReplyTo: data.in_reply_to || data.inReplyTo,
      references: data.references,
    })

    if (!result) {
      return NextResponse.json({ success: true, message: 'Already recorded' })
    }

    return NextResponse.json({ success: true, threadId: result.thread.id })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 }
    )
  }
}
