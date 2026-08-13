import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from './supabaseClient'
import {
  bookingReceivedAdmin,
  bookingReceivedCustomer,
  bookingUpdateAdmin,
  bookingUpdateCustomer,
  contactAdmin,
  contactAutoReply,
  depositInvoiceCustomer,
  invoiceCustomer,
  payLaterAdmin,
  payLaterCustomer,
  type BookingEmailPayload,
  type ContactEmailPayload,
} from './email/templates'

export type BookingForEmail = BookingEmailPayload

interface EmailSettings {
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  fromEmail: string
  fromName: string
}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  /** Override sender, e.g. "Hashantha <hashantha@isleandecho.com>" */
  from?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content?: Buffer
    contentType?: string
    url?: string
  }>
}

function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

function stripEnvQuotes(value: string | undefined): string {
  if (!value) return ''
  let v = value.trim()
  while (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v
}

/** Resend-safe From header: quotes display names with special characters. */
export function formatEmailFrom(name: string, email: string): string {
  const cleanEmail = stripEnvQuotes(email).replace(/^<|>$/g, '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error(`Invalid sender email address: ${cleanEmail || '(empty)'}`)
  }

  const cleanName = stripEnvQuotes(name).trim()
  if (!cleanName) return cleanEmail

  const needsQuotes = /[,;<>@"&]/.test(cleanName)
  const safeName = needsQuotes ? `"${cleanName.replace(/"/g, '\\"')}"` : cleanName
  return `${safeName} <${cleanEmail}>`
}

function normalizeFromAddress(raw: string | undefined): string {
  const value = stripEnvQuotes(raw)
  if (!value) return ''

  const angle = value.match(/^(?:"?([^"]*)"?\s)?<([^>]+@[^>]+)>$/)
  if (angle) {
    return formatEmailFrom(angle[1]?.trim() || '', angle[2].trim())
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return value.toLowerCase()
  }

  return formatEmailFrom('Isle & Echo', value)
}

function envEmailDefaults(): EmailSettings {
  return {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUsername: process.env.SMTP_USERNAME || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromEmail:
      stripEnvQuotes(process.env.FROM_EMAIL) ||
      stripEnvQuotes(process.env.SMTP_USERNAME) ||
      'noreply@isleandecho.com',
    fromName: stripEnvQuotes(process.env.FROM_NAME) || 'Isle & Echo',
  }
}

async function getEmailSettings(): Promise<EmailSettings> {
  const defaults = envEmailDefaults()

  if (isSupabaseConfigured()) {
    try {
      const { data: settingsData } = await supabaseAdmin
        .from('settings')
        .select('smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name')
        .eq('id', 'main')
        .single()

      if (settingsData) {
        const fromEmail =
          stripEnvQuotes(settingsData.from_email as string) || defaults.fromEmail
        const fromName =
          stripEnvQuotes(settingsData.from_name as string) || defaults.fromName

        if (settingsData.smtp_host && settingsData.smtp_username) {
          return {
            smtpHost: settingsData.smtp_host || 'smtp.gmail.com',
            smtpPort: settingsData.smtp_port || '587',
            smtpUsername: settingsData.smtp_username,
            smtpPassword: settingsData.smtp_password || '',
            fromEmail,
            fromName,
          }
        }

        return { ...defaults, fromEmail, fromName }
      }
    } catch (error) {
      console.error('Error fetching email settings from database:', error)
    }
  }

  return defaults
}

export async function getAdminEmails(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from('settings')
        .select('admin_email')
        .eq('id', 'main')
        .single()
      const raw = (data?.admin_email as string) || process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || ''
      return raw.split(',').map((e) => e.trim()).filter(Boolean)
    } catch (error) {
      console.error('Error fetching admin emails:', error)
    }
  }
  const env = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || ''
  return env ? env.split(',').map((e) => e.trim()).filter(Boolean) : []
}

async function bookingNotificationsEnabled() {
  if (!isSupabaseConfigured()) return true
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('booking_notifications')
      .eq('id', 'main')
      .single()
    return (data?.booking_notifications ?? true) as boolean
  } catch {
    return true
  }
}

function resendFromAddress(settings: EmailSettings) {
  const envFrom = normalizeFromAddress(process.env.RESEND_FROM_EMAIL)
  if (envFrom) return envFrom
  return formatEmailFrom(settings.fromName, settings.fromEmail)
}

function hasResend() {
  const key = (process.env.RESEND_API_KEY || '').trim()
  return key.length > 10 && key !== 're_xxxxxxxxx' && !key.includes('xxxx')
}

function resolveFromAddress(options: SendEmailOptions, settings: EmailSettings) {
  if (options.from) return normalizeFromAddress(options.from)
  return resendFromAddress(settings)
}

async function sendViaResend(options: SendEmailOptions, settings: EmailSettings) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  const from = resolveFromAddress(options, settings)
  const { data, error } = await resend.emails.send({
    from,
    to: recipients,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments?.map((file) =>
      file.url
        ? { filename: file.filename, path: file.url, contentType: file.contentType }
        : { filename: file.filename, content: file.content, contentType: file.contentType }
    ),
  })

  if (error) {
    throw new Error(error.message || 'Resend failed to send email')
  }
  console.log('Email sent via Resend:', data?.id, 'to', recipients.join(', '))
  return true
}

async function sendViaSmtp(options: SendEmailOptions, settings: EmailSettings) {
  if (!settings.smtpUsername || !settings.smtpPassword) {
    throw new Error(
      'Email is not configured on the server. Add RESEND_API_KEY in your hosting dashboard (Vercel → Environment Variables), or set SMTP username and password in Admin → Settings.'
    )
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort, 10),
    secure: settings.smtpPort === '465',
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  })

  const info = await transporter.sendMail({
    from: options.from ? normalizeFromAddress(options.from) : formatEmailFrom(settings.fromName, settings.fromEmail),
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    subject: options.subject,
    text: options.text || '',
    html: options.html,
    replyTo: options.replyTo,
    attachments: options.attachments?.map((file) =>
      file.url
        ? { filename: file.filename, href: file.url, contentType: file.contentType }
        : { filename: file.filename, content: file.content, contentType: file.contentType }
    ),
  })
  console.log('Email sent via SMTP:', info.messageId)
  return true
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const settings = await getEmailSettings()
  try {
    if (hasResend()) {
      return await sendViaResend(options, settings)
    }
    return await sendViaSmtp(options, settings)
  } catch (error) {
    console.error('Error sending email:', error)
    if (error instanceof Error && error.message.includes('Invalid `from` field')) {
      throw new Error(
        `Invalid sender address. Set RESEND_FROM_EMAIL in Vercel to a verified address, e.g. Isle & Echo <noreply@isleandecho.com> (current from: ${resolveFromAddress(options, settings)})`
      )
    }
    throw error
  }
}

async function sendToAdmins(message: { subject: string; html: string; text: string }, replyTo?: string) {
  if (!(await bookingNotificationsEnabled())) return
  const adminEmails = await getAdminEmails()
  if (adminEmails.length === 0) {
    console.warn('No admin email configured. Set ADMIN_EMAIL to receive notifications.')
    return
  }
  for (const to of adminEmails) {
    try {
      await sendEmail({ to, ...message, replyTo })
    } catch (err) {
      console.error('Failed to email admin', to, err)
    }
  }
}

export async function sendInvoiceEmail(
  customerEmail: string,
  customerName: string,
  bookingId: string,
  invoicePdf: Buffer
): Promise<boolean> {
  const message = invoiceCustomer(customerName, bookingId)
  return sendEmail({
    to: customerEmail,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: [
      {
        filename: `Invoice-${bookingId}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      },
    ],
  })
}

export async function sendBookingConfirmationToCustomer(booking: BookingForEmail): Promise<boolean> {
  const message = bookingReceivedCustomer(booking)
  return sendEmail({
    to: booking.customer_email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}

export async function sendBookingConfirmationToAdmin(booking: BookingForEmail): Promise<void> {
  const message = bookingReceivedAdmin(booking)
  await sendToAdmins(message, booking.customer_email)
}

export async function notifyBookingCreated(booking: BookingForEmail): Promise<void> {
  if (!booking.customer_email) return
  try {
    await sendBookingConfirmationToCustomer(booking)
  } catch (error) {
    console.error('Failed to send booking received email to customer:', error)
  }
  try {
    await sendBookingConfirmationToAdmin(booking)
  } catch (error) {
    console.error('Failed to send booking received email to admin:', error)
  }
}

export async function notifyBookingUpdated(
  booking: BookingForEmail,
  previous?: { status?: string; payment_status?: string }
): Promise<void> {
  const statusChanged = previous?.status && previous.status !== booking.status
  const paymentChanged = previous?.payment_status && previous.payment_status !== booking.payment_status
  if (!statusChanged && !paymentChanged) return
  if (!booking.customer_email) return

  try {
    const message = bookingUpdateCustomer(booking, previous)
    await sendEmail({
      to: booking.customer_email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
  } catch (error) {
    console.error('Failed to send booking update email to customer:', error)
  }

  try {
    const message = bookingUpdateAdmin(booking)
    await sendToAdmins(message, booking.customer_email)
  } catch (error) {
    console.error('Failed to send booking update email to admin:', error)
  }
}

export async function notifyPayLaterSelected(booking: BookingForEmail): Promise<void> {
  if (!booking.customer_email) return
  try {
    const message = payLaterCustomer(booking)
    await sendEmail({
      to: booking.customer_email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
  } catch (error) {
    console.error('Failed to send pay-later email to customer:', error)
  }
  try {
    const message = payLaterAdmin(booking)
    await sendToAdmins(message, booking.customer_email)
  } catch (error) {
    console.error('Failed to send pay-later email to admin:', error)
  }
}

export async function sendDepositInvoiceEmail(
  booking: BookingForEmail,
  invoicePdf: Buffer,
  amounts: { total: string; deposit: string; balance: string; percent: number },
  paymentLink?: string
): Promise<void> {
  if (!booking.customer_email) {
    throw new Error('Customer email is missing')
  }
  const message = depositInvoiceCustomer(booking, amounts, paymentLink)
  await sendEmail({
    to: booking.customer_email,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: [
      {
        filename: `Invoice-${booking.id}-deposit.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      },
    ],
  })
  try {
    await sendToAdmins({
      subject: `50% invoice + PayHere link sent · ${booking.id} · ${booking.customer_name}`,
      html: message.html,
      text: `Deposit invoice and PayHere link sent to ${booking.customer_email} for ${booking.id}. Due now: ${amounts.deposit}. Link: ${paymentLink || 'n/a'}`,
    }, booking.customer_email)
  } catch (error) {
    console.error('Failed to copy deposit invoice to admin:', error)
  }
}

export async function notifyContactMessage(payload: ContactEmailPayload): Promise<void> {
  const adminMessage = contactAdmin(payload)
  const adminEmails = await getAdminEmails()
  if (adminEmails.length === 0) {
    throw new Error('Contact email is not configured. Set ADMIN_EMAIL.')
  }

  for (const to of adminEmails) {
    await sendEmail({
      to,
      subject: adminMessage.subject,
      html: adminMessage.html,
      text: adminMessage.text,
      replyTo: payload.email,
    })
  }

  try {
    const reply = contactAutoReply(payload)
    await sendEmail({
      to: payload.email,
      subject: reply.subject,
      html: reply.html,
      text: reply.text,
    })
  } catch (error) {
    console.error('Failed to send contact auto-reply:', error)
  }
}
