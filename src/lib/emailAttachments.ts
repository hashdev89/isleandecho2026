import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabaseClient'
import type { EmailAttachment } from './emailCenter'

export const EMAIL_ATTACHMENTS_BUCKET = 'email-attachments'
export const MAX_EMAIL_ATTACHMENT_BYTES = 4 * 1024 * 1024
export const MAX_EMAIL_ATTACHMENTS = 8

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
)

function sanitizeFilename(name: string) {
  return String(name || 'attachment')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'attachment'
}

async function ensureEmailAttachmentsBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.some((b) => b.name === EMAIL_ATTACHMENTS_BUCKET)) return true

  const { error } = await supabaseAdmin.storage.createBucket(EMAIL_ATTACHMENTS_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_EMAIL_ATTACHMENT_BYTES}`,
  })
  if (error) {
    console.error('email attachments bucket create:', error.message)
    return false
  }
  return true
}

export async function storeEmailAttachment(
  filename: string,
  content: Buffer,
  contentType?: string
): Promise<EmailAttachment> {
  const safeName = sanitizeFilename(filename)
  const id = randomUUID()

  if (!hasSupabase) {
    throw new Error('Supabase is required to store email attachments on this server.')
  }
  if (!(await ensureEmailAttachmentsBucket())) {
    throw new Error('Could not create the email-attachments storage bucket.')
  }

  const ext = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.')) : ''
  const path = `${new Date().toISOString().slice(0, 10)}/${id}${ext}`
  const { error } = await supabaseAdmin.storage.from(EMAIL_ATTACHMENTS_BUCKET).upload(path, content, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data } = supabaseAdmin.storage.from(EMAIL_ATTACHMENTS_BUCKET).getPublicUrl(path)
  return {
    id,
    filename: safeName,
    contentType: contentType || undefined,
    size: content.byteLength,
    url: data.publicUrl,
  }
}

export function isImageAttachment(attachment: EmailAttachment) {
  const type = (attachment.contentType || '').toLowerCase()
  const name = (attachment.filename || '').toLowerCase()
  return (
    type.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
  )
}

export function isPdfAttachment(attachment: EmailAttachment) {
  const type = (attachment.contentType || '').toLowerCase()
  const name = (attachment.filename || '').toLowerCase()
  return type === 'application/pdf' || name.endsWith('.pdf')
}
