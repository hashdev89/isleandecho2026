import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabaseClient'
import { loadAppJson, saveAppJson } from './supabaseJsonStore'
import { sendEmail, formatEmailFrom } from './emailService'
import { storeEmailAttachment } from './emailAttachments'
import { canAccessEmailCenter } from './roles'

export type EmailFolder = 'inbox' | 'sent' | 'trash' | 'starred'

export type EmailAccount = {
  id: string
  name: string
  email: string
  isDefault?: boolean
  isActive?: boolean
  /** Dashboard user IDs (admin/staff) who can access this inbox. Admins always see all. */
  assignedUserIds?: string[]
  /** Personal backup inbox, e.g. hashdev89@gmail.com */
  backupEmail?: string
  /** Auto-forward received mail to backupEmail */
  forwardInbound?: boolean
  /** BCC sent mail to backupEmail as a backup copy */
  forwardOutbound?: boolean
}

export type EmailAttachment = {
  id: string
  filename: string
  contentType?: string
  size?: number
  url?: string
  resendAttachmentId?: string
}

export type EmailMessage = {
  id: string
  threadId: string
  resendEmailId?: string
  messageId?: string
  fromEmail: string
  fromName: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  bodyHtml: string
  bodyText: string
  direction: 'inbound' | 'outbound'
  sentByUserId?: string
  sentByUserName?: string
  readAt?: string | null
  starred?: boolean
  inReplyTo?: string
  references?: string[]
  attachments?: EmailAttachment[]
  createdAt: string
}

export type EmailThread = {
  id: string
  subject: string
  accountEmail: string
  participants: string[]
  folder: EmailFolder
  starred: boolean
  unreadCount: number
  lastMessageAt: string
  lastPreview: string
  lastFromName: string
  lastFromEmail: string
  status: 'open' | 'archived'
  createdAt: string
  updatedAt: string
}

export type EmailCenterSettings = {
  accounts: EmailAccount[]
  resendWebhookSecret?: string
}

const DATA_DIR = path.join(process.cwd(), 'data', 'email')
const THREADS_FILE = path.join(DATA_DIR, 'threads.json')
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
const THREADS_JSON_KEY = 'email-threads.json'
const MESSAGES_JSON_KEY = 'email-messages.json'
const SETTINGS_JSON_KEY = 'email-settings.json'

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
)

function isServerlessFs() {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.cwd().includes('/var/task')
  )
}

function isMissingTableError(error?: { code?: string; message?: string } | null) {
  const msg = (error?.message || '').toLowerCase()
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  )
}

function ensureDataDir() {
  if (isServerlessFs()) return false
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    return true
  } catch (e) {
    console.error('emailCenter ensureDataDir:', e)
    return false
  }
}

function loadJson<T>(file: string, fallback: T): T {
  if (isServerlessFs()) return fallback
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch (e) {
    console.error(`emailCenter load ${file}:`, e)
  }
  return fallback
}

function saveJson(file: string, data: unknown) {
  if (isServerlessFs()) return false
  if (!ensureDataDir()) return false
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch (e) {
    console.error(`emailCenter save ${file}:`, e)
    return false
  }
}

function persistFailedMessage(what: string) {
  return `Could not save ${what} on the live server. Run scripts/supabase-email-center.sql in Supabase, then try again.`
}

export function defaultEmailAccounts(): EmailAccount[] {
  const from = process.env.RESEND_FROM_EMAIL || process.env.ADMIN_EMAIL || 'info@isleandecho.com'
  const match = from.match(/<([^>]+)>/)
  const email = match ? match[1] : from.replace(/"/g, '').trim()
  return [
    {
      id: 'support',
      name: 'Support',
      email: email || 'info@isleandecho.com',
      isDefault: true,
      isActive: true,
    },
  ]
}

export async function getEmailCenterSettings(): Promise<EmailCenterSettings> {
  if (hasSupabase) {
    try {
      const { data } = await supabaseAdmin
        .from('settings')
        .select('email_accounts, resend_webhook_secret')
        .eq('id', 'main')
        .single()
      if (data?.email_accounts) {
        return {
          accounts: data.email_accounts as EmailAccount[],
          resendWebhookSecret: (data.resend_webhook_secret as string) || process.env.RESEND_WEBHOOK_SECRET,
        }
      }
    } catch {
      /* fallback */
    }
    const remote = await loadAppJson<EmailCenterSettings>(SETTINGS_JSON_KEY)
    if (remote?.accounts?.length) {
      return {
        accounts: remote.accounts,
        resendWebhookSecret: remote.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET,
      }
    }
  }
  const local = loadJson<EmailCenterSettings>(SETTINGS_FILE, { accounts: defaultEmailAccounts() })
  return {
    accounts: local.accounts?.length ? local.accounts : defaultEmailAccounts(),
    resendWebhookSecret: local.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET,
  }
}

export async function saveEmailCenterSettings(settings: EmailCenterSettings) {
  let persisted = false
  if (hasSupabase) {
    const { error } = await supabaseAdmin.from('settings').upsert({
      id: 'main',
      email_accounts: settings.accounts,
      resend_webhook_secret: settings.resendWebhookSecret || null,
      updated_at: new Date().toISOString(),
    })
    if (!error) persisted = true
    else {
      console.error('emailCenter saveSettings:', error.message)
      persisted = await saveAppJson(SETTINGS_JSON_KEY, settings)
    }
  }
  if (saveJson(SETTINGS_FILE, settings)) persisted = true
  if (!persisted && isServerlessFs()) throw new Error(persistFailedMessage('email settings'))
}

async function loadThreads(): Promise<EmailThread[]> {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
      if (!error && data) return data.map(mapThreadFromDb)
      if (error) console.error('emailCenter loadThreads:', error.message)
    } catch (e) {
      console.error('emailCenter loadThreads:', e)
    }
    const remote = await loadAppJson<EmailThread[]>(THREADS_JSON_KEY)
    if (remote) return remote
  }
  return loadJson<EmailThread[]>(THREADS_FILE, [])
}

async function saveThreads(threads: EmailThread[]) {
  let persisted = false
  if (hasSupabase) {
    let missingTable = false
    for (const t of threads) {
      const { error } = await supabaseAdmin.from('email_threads').upsert(mapThreadToDb(t))
      if (!error) continue
      console.error('emailCenter saveThreads:', error.message, t.id)
      if (isMissingTableError(error)) {
        missingTable = true
        break
      }
      throw new Error(error.message)
    }
    if (!missingTable) persisted = true
    else persisted = await saveAppJson(THREADS_JSON_KEY, threads)
  }
  if (saveJson(THREADS_FILE, threads)) persisted = true
  if (!persisted) throw new Error(persistFailedMessage('emails'))
}

async function loadMessages(): Promise<EmailMessage[]> {
  if (hasSupabase) {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) return data.map(mapMessageFromDb)
      if (error) console.error('emailCenter loadMessages:', error.message)
    } catch (e) {
      console.error('emailCenter loadMessages:', e)
    }
    const remote = await loadAppJson<EmailMessage[]>(MESSAGES_JSON_KEY)
    if (remote) return remote
  }
  return loadJson<EmailMessage[]>(MESSAGES_FILE, [])
}

async function saveMessages(messages: EmailMessage[]) {
  let persisted = false
  if (hasSupabase) {
    let missingTable = false
    for (const m of messages) {
      const { error } = await supabaseAdmin.from('email_messages').upsert(mapMessageToDb(m))
      if (!error) continue
      console.error('emailCenter saveMessages:', error.message, m.id)
      if (isMissingTableError(error)) {
        missingTable = true
        break
      }
      throw new Error(error.message)
    }
    if (!missingTable) persisted = true
    else persisted = await saveAppJson(MESSAGES_JSON_KEY, messages)
  }
  if (saveJson(MESSAGES_FILE, messages)) persisted = true
  if (!persisted) throw new Error(persistFailedMessage('emails'))
}

function mapThreadFromDb(row: Record<string, unknown>): EmailThread {
  return {
    id: String(row.id),
    subject: String(row.subject || ''),
    accountEmail: String(row.account_email || ''),
    participants: (row.participants as string[]) || [],
    folder: (row.folder as EmailFolder) || 'inbox',
    starred: Boolean(row.starred),
    unreadCount: Number(row.unread_count || 0),
    lastMessageAt: String(row.last_message_at || row.created_at),
    lastPreview: String(row.last_preview || ''),
    lastFromName: String(row.last_from_name || ''),
    lastFromEmail: String(row.last_from_email || ''),
    status: (row.status as 'open' | 'archived') || 'open',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at || row.created_at),
  }
}

function mapThreadToDb(t: EmailThread) {
  return {
    id: t.id,
    subject: t.subject,
    account_email: t.accountEmail,
    participants: t.participants,
    folder: t.folder,
    starred: t.starred,
    unread_count: t.unreadCount,
    last_message_at: t.lastMessageAt,
    last_preview: t.lastPreview,
    last_from_name: t.lastFromName,
    last_from_email: t.lastFromEmail,
    status: t.status,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }
}

function mapMessageFromDb(row: Record<string, unknown>): EmailMessage {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    resendEmailId: row.resend_email_id ? String(row.resend_email_id) : undefined,
    messageId: row.message_id ? String(row.message_id) : undefined,
    fromEmail: String(row.from_email || ''),
    fromName: String(row.from_name || ''),
    to: (row.to_emails as string[]) || [],
    cc: (row.cc_emails as string[]) || undefined,
    bcc: (row.bcc_emails as string[]) || undefined,
    subject: String(row.subject || ''),
    bodyHtml: String(row.body_html || ''),
    bodyText: String(row.body_text || ''),
    direction: (row.direction as 'inbound' | 'outbound') || 'inbound',
    sentByUserId: row.sent_by_user_id ? String(row.sent_by_user_id) : undefined,
    sentByUserName: row.sent_by_user_name ? String(row.sent_by_user_name) : undefined,
    readAt: row.read_at ? String(row.read_at) : null,
    starred: Boolean(row.starred),
    inReplyTo: row.in_reply_to ? String(row.in_reply_to) : undefined,
    references: (row.message_references as string[]) || undefined,
    attachments: (row.attachments as EmailAttachment[]) || undefined,
    createdAt: String(row.created_at),
  }
}

function mapMessageToDb(m: EmailMessage) {
  return {
    id: m.id,
    thread_id: m.threadId,
    resend_email_id: m.resendEmailId || null,
    message_id: m.messageId || null,
    from_email: m.fromEmail,
    from_name: m.fromName,
    to_emails: m.to,
    cc_emails: m.cc || null,
    bcc_emails: m.bcc || null,
    subject: m.subject,
    body_html: m.bodyHtml,
    body_text: m.bodyText,
    direction: m.direction,
    sent_by_user_id: m.sentByUserId || null,
    sent_by_user_name: m.sentByUserName || null,
    read_at: m.readAt || null,
    starred: m.starred || false,
    in_reply_to: m.inReplyTo || null,
    message_references: m.references || null,
    attachments: m.attachments || null,
    created_at: m.createdAt,
  }
}

function preview(text: string, max = 120) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

function parseEmailAddress(raw: string): string {
  const trimmed = String(raw || '').trim()
  const angle = trimmed.match(/<([^>]+@[^>]+)>/)
  if (angle) return angle[1].trim().toLowerCase()
  const bare = trimmed.match(/[^\s<>"']+@[^\s<>"']+/)
  return (bare ? bare[0] : trimmed).toLowerCase()
}

function parseFromHeader(raw: string): { email: string; name: string } {
  const trimmed = String(raw || '').trim()
  const match = trimmed.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/)
  const email = parseEmailAddress(match?.[2] || trimmed)
  const name = match?.[1]?.trim() || email
  return { email, name }
}

function normalizeEmail(email: string) {
  return parseEmailAddress(email)
}

/** Accounts a user may access. Admins see all active accounts; staff only assigned ones. */
export function getAccessibleAccounts(
  accounts: EmailAccount[],
  userId: string,
  userRole: string
): EmailAccount[] {
  const active = accounts.filter((a) => a.isActive !== false && a.email?.trim())
  if (canAccessEmailCenter(userRole) || userRole === 'admin') return active
  return active.filter((a) => (a.assignedUserIds || []).includes(userId))
}

export function canAccessAccount(
  accounts: EmailAccount[],
  accountId: string,
  userId: string,
  userRole: string
): boolean {
  if (canAccessEmailCenter(userRole) || userRole === 'admin') return true
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return false
  return (account.assignedUserIds || []).includes(userId)
}

export function canAccessThread(
  thread: EmailThread,
  accounts: EmailAccount[],
  userId: string,
  userRole: string
): boolean {
  if (canAccessEmailCenter(userRole) || userRole === 'admin') return true
  const accessible = getAccessibleAccounts(accounts, userId, userRole)
  return accessible.some((a) => normalizeEmail(a.email) === normalizeEmail(thread.accountEmail))
}

function filterByAccessibleEmails(threads: EmailThread[], emails: string[]) {
  const allowed = new Set(emails.map(normalizeEmail))
  if (allowed.size === 0) return []
  return threads.filter((t) => allowed.has(normalizeEmail(t.accountEmail)))
}

function normalizeEmailList(value?: string | string[]) {
  if (!value) return []
  const arr = Array.isArray(value) ? value : value.split(/[,;]/).map((s) => s.trim())
  return arr.filter((e) => e && /\S+@\S+\.\S+/.test(e))
}

export async function listThreads(filter: {
  folder?: EmailFolder | 'all' | 'unread'
  search?: string
  accountEmail?: string
  accessibleEmails?: string[]
}) {
  let threads = await loadThreads()
  const folder = filter.folder || 'inbox'

  if (filter.accessibleEmails) {
    threads = filterByAccessibleEmails(threads, filter.accessibleEmails)
  }

  if (folder === 'starred') {
    threads = threads.filter((t) => t.starred && t.folder !== 'trash')
  } else if (folder === 'unread') {
    threads = threads.filter((t) => t.unreadCount > 0 && t.folder !== 'trash')
  } else if (folder !== 'all') {
    threads = threads.filter((t) => t.folder === folder)
  } else {
    threads = threads.filter((t) => t.folder !== 'trash')
  }

  if (filter.accountEmail) {
    threads = threads.filter((t) => normalizeEmail(t.accountEmail) === normalizeEmail(filter.accountEmail!))
  }

  if (filter.search?.trim()) {
    const q = filter.search.toLowerCase()
    threads = threads.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.lastPreview.toLowerCase().includes(q) ||
        t.lastFromName.toLowerCase().includes(q) ||
        t.participants.some((p) => p.toLowerCase().includes(q))
    )
  }

  threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  return threads
}

export async function getThreadWithMessages(threadId: string) {
  const threads = await loadThreads()
  const messages = await loadMessages()
  const thread = threads.find((t) => t.id === threadId)
  if (!thread) return null

  const threadMessages = messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  let changed = false
  const hydrated: EmailMessage[] = []
  for (const msg of threadMessages) {
    const needsHydrate =
      msg.direction === 'inbound' &&
      !!msg.resendEmailId &&
      (!msg.attachments?.length || msg.attachments.some((a) => !a.url))
    if (!needsHydrate) {
      hydrated.push(msg)
      continue
    }
    const imported = await importResendAttachments(msg.resendEmailId as string)
    if (imported.length) {
      changed = true
      hydrated.push({ ...msg, attachments: imported })
    } else {
      hydrated.push(msg)
    }
  }

  if (changed) {
    const byId = new Map(hydrated.map((m) => [m.id, m]))
    await saveMessages(messages.map((m) => byId.get(m.id) || m))
  }

  return { thread, messages: hydrated }
}

export async function markThreadRead(threadId: string) {
  const threads = await loadThreads()
  const messages = await loadMessages()
  const now = new Date().toISOString()
  const idx = threads.findIndex((t) => t.id === threadId)
  if (idx === -1) return false
  threads[idx] = { ...threads[idx], unreadCount: 0, updatedAt: now }
  const updatedMessages = messages.map((m) =>
    m.threadId === threadId && !m.readAt ? { ...m, readAt: now } : m
  )
  await saveThreads(threads)
  await saveMessages(updatedMessages)
  return true
}

export async function updateThread(
  threadId: string,
  patch: Partial<Pick<EmailThread, 'starred' | 'folder' | 'status'>>
) {
  const threads = await loadThreads()
  const idx = threads.findIndex((t) => t.id === threadId)
  if (idx === -1) return null
  threads[idx] = { ...threads[idx], ...patch, updatedAt: new Date().toISOString() }
  await saveThreads(threads)
  return threads[idx]
}

export async function restoreThread(threadId: string) {
  const threads = await loadThreads()
  const messages = await loadMessages()
  const idx = threads.findIndex((t) => t.id === threadId)
  if (idx === -1) return null
  const threadMsgs = messages.filter((m) => m.threadId === threadId)
  const hasInbound = threadMsgs.some((m) => m.direction === 'inbound')
  const folder: EmailFolder = hasInbound || threadMsgs.length === 0 ? 'inbox' : 'sent'
  threads[idx] = {
    ...threads[idx],
    folder,
    status: 'open',
    updatedAt: new Date().toISOString(),
  }
  await saveThreads(threads)
  return threads[idx]
}

export async function permanentlyDeleteThread(threadId: string) {
  const threads = await loadThreads()
  const messages = await loadMessages()
  if (!threads.some((t) => t.id === threadId)) return false

  const nextThreads = threads.filter((t) => t.id !== threadId)
  const nextMessages = messages.filter((m) => m.threadId !== threadId)

  if (hasSupabase) {
    const { error: msgErr } = await supabaseAdmin.from('email_messages').delete().eq('thread_id', threadId)
    if (msgErr && !isMissingTableError(msgErr)) throw new Error(msgErr.message)
    const { error: thErr } = await supabaseAdmin.from('email_threads').delete().eq('id', threadId)
    if (thErr && !isMissingTableError(thErr)) throw new Error(thErr.message)
    await saveAppJson(THREADS_JSON_KEY, nextThreads)
    await saveAppJson(MESSAGES_JSON_KEY, nextMessages)
  }

  saveJson(THREADS_FILE, nextThreads)
  saveJson(MESSAGES_FILE, nextMessages)
  return true
}

export async function emptyTrash(accessibleEmails?: string[]) {
  let threads = await loadThreads()
  if (accessibleEmails) threads = filterByAccessibleEmails(threads, accessibleEmails)
  const trashIds = threads.filter((t) => t.folder === 'trash').map((t) => t.id)
  for (const id of trashIds) {
    await permanentlyDeleteThread(id)
  }
  return trashIds.length
}

function backupAddress(account?: EmailAccount | null) {
  const backup = parseEmailAddress(account?.backupEmail || '')
  if (!backup || !backup.includes('@')) return null
  if (account?.email && parseEmailAddress(account.email) === backup) return null
  return backup
}

async function forwardInboundBackup(account: EmailAccount | undefined, message: EmailMessage) {
  const backup = backupAddress(account)
  if (!backup || !account?.forwardInbound) return
  if (parseEmailAddress(message.fromEmail) === backup) return
  try {
    const subject = message.subject.startsWith('[Fwd]') ? message.subject : `[Fwd] ${message.subject}`
    await sendEmail({
      to: backup,
      subject,
      html: `<p style="color:#555;font-size:13px;margin:0 0 12px">Backup copy of mail received at <strong>${account.email}</strong> from ${message.fromName} &lt;${message.fromEmail}&gt;.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px"/>${message.bodyHtml || `<p>${(message.bodyText || '').replace(/\n/g, '<br>')}</p>`}`,
      text: `Backup copy of mail received at ${account.email} from ${message.fromEmail}\n\n${message.bodyText || ''}`,
      replyTo: message.fromEmail,
      from: formatEmailFrom(account.name || 'Isle & Echo', account.email),
      attachments: message.attachments
        ?.filter((file) => file.url)
        .map((file) => ({
          filename: file.filename,
          contentType: file.contentType,
          url: file.url,
        })),
    })
  } catch (error) {
    console.error('emailCenter inbound backup forward failed:', error)
  }
}

export async function recordInboundEmail(input: {
  fromEmail: string
  fromName?: string
  to?: string[]
  subject: string
  bodyHtml?: string
  bodyText?: string
  accountEmail?: string
  messageId?: string
  resendEmailId?: string
  inReplyTo?: string
  references?: string[]
  attachments?: EmailAttachment[]
}) {
  const messages = await loadMessages()
  if (input.resendEmailId && messages.some((m) => m.resendEmailId === input.resendEmailId)) {
    return null
  }
  if (input.messageId && messages.some((m) => m.messageId === input.messageId)) {
    return null
  }

  const settings = await getEmailCenterSettings()
  const toAddresses = (input.to || []).map(parseEmailAddress).filter(Boolean)
  const matchedAccount =
    settings.accounts.find(
      (a) =>
        a.isActive !== false &&
        toAddresses.some((to) => parseEmailAddress(a.email) === to)
    ) ||
    settings.accounts.find((a) => a.isDefault) ||
    settings.accounts[0]
  const accountEmail =
    matchedAccount?.email ||
    (input.accountEmail ? parseEmailAddress(input.accountEmail) : '') ||
    toAddresses[0] ||
    'info@isleandecho.com'
  const now = new Date().toISOString()
  const threads = await loadThreads()

  let thread: EmailThread | undefined
  if (input.inReplyTo || input.references?.length) {
    const parent = messages.find(
      (m) => m.messageId === input.inReplyTo || input.references?.includes(m.messageId || '')
    )
    if (parent) thread = threads.find((t) => t.id === parent.threadId)
  }
  if (!thread) {
    const normalizedSubject = input.subject.replace(/^(re:\s*)+/i, '').trim()
    thread = threads.find(
      (t) =>
        t.folder !== 'trash' &&
        t.subject.replace(/^(re:\s*)+/i, '').trim().toLowerCase() === normalizedSubject.toLowerCase() &&
        t.participants.includes(input.fromEmail.toLowerCase())
    )
  }

  const bodyText = input.bodyText || input.bodyHtml?.replace(/<[^>]+>/g, ' ') || ''
  const messageId = input.messageId || `<${randomUUID()}@isleandecho.local>`
  let attachments = input.attachments
  if ((!attachments || attachments.length === 0) && input.resendEmailId) {
    attachments = await importResendAttachments(input.resendEmailId)
  }

  if (!thread) {
    thread = {
      id: randomUUID(),
      subject: input.subject,
      accountEmail,
      participants: [input.fromEmail.toLowerCase(), accountEmail.toLowerCase()],
      folder: 'inbox',
      starred: false,
      unreadCount: 1,
      lastMessageAt: now,
      lastPreview: preview(bodyText),
      lastFromName: input.fromName || input.fromEmail,
      lastFromEmail: input.fromEmail,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
    threads.push(thread)
  } else {
    thread = {
      ...thread,
      subject: input.subject || thread.subject,
      unreadCount: thread.unreadCount + 1,
      lastMessageAt: now,
      lastPreview: preview(bodyText),
      lastFromName: input.fromName || input.fromEmail,
      lastFromEmail: input.fromEmail,
      updatedAt: now,
      folder: thread.folder === 'sent' ? 'inbox' : thread.folder,
    }
    const tIdx = threads.findIndex((t) => t.id === thread!.id)
    threads[tIdx] = thread
  }

  const message: EmailMessage = {
    id: randomUUID(),
    threadId: thread.id,
    resendEmailId: input.resendEmailId,
    messageId,
    fromEmail: input.fromEmail,
    fromName: input.fromName || input.fromEmail,
    to: input.to || [accountEmail],
    subject: input.subject,
    bodyHtml: input.bodyHtml || `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
    bodyText,
    direction: 'inbound',
    inReplyTo: input.inReplyTo,
    references: input.references,
    attachments: attachments?.length ? attachments : undefined,
    createdAt: now,
  }
  messages.push(message)
  await saveThreads(threads)
  await saveMessages(messages)
  await forwardInboundBackup(matchedAccount, message)
  return { thread, message }
}

type ResendReceivedListItem = {
  id: string
  from: string
  to: string[]
  subject?: string
  message_id?: string
  created_at?: string
}

type ResendReceivedEmail = ResendReceivedListItem & {
  html?: string | null
  text?: string | null
  headers?: Record<string, string>
}

async function resendApiGet<T>(path: string): Promise<T> {
  const apiKey = process.env.RESEND_API_KEY || ''
  if (apiKey.length < 10 || apiKey === 're_xxxxxxxxx') {
    throw new Error('RESEND_API_KEY is not configured')
  }
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API ${path} failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<T>
}

type ResendInboundAttachment = {
  id: string
  filename?: string
  size?: number
  content_type?: string
  download_url?: string
}

export async function importResendAttachments(resendEmailId: string): Promise<EmailAttachment[]> {
  try {
    const list = await resendApiGet<{ data?: ResendInboundAttachment[] }>(
      `/emails/receiving/${encodeURIComponent(resendEmailId)}/attachments`
    )
    const items = list.data || []
    const stored: EmailAttachment[] = []

    for (const item of items) {
      if (!item.download_url) continue
      try {
        const res = await fetch(item.download_url)
        if (!res.ok) throw new Error(`download failed ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        const saved = await storeEmailAttachment(
          item.filename || 'attachment',
          buf,
          item.content_type || res.headers.get('content-type') || undefined
        )
        stored.push({
          ...saved,
          resendAttachmentId: item.id,
          size: item.size || saved.size,
        })
      } catch (error) {
        console.error('importResendAttachments item:', item.id, error)
        stored.push({
          id: item.id,
          filename: item.filename || 'attachment',
          contentType: item.content_type,
          size: item.size,
          url: item.download_url,
          resendAttachmentId: item.id,
        })
      }
    }

    return stored
  } catch (error) {
    console.error('importResendAttachments:', error)
    return []
  }
}

/** Pull received emails from Resend into the inbox (webhook fallback / manual sync). */
export async function syncInboundFromResend(limit = 50) {
  const list = await resendApiGet<{ data?: ResendReceivedListItem[] }>(
    `/emails/receiving?limit=${Math.min(Math.max(limit, 1), 100)}`
  )
  const items = list.data || []
  let imported = 0
  let skipped = 0

  for (const item of items) {
    try {
      const full = await resendApiGet<ResendReceivedEmail>(`/emails/receiving/${item.id}`)
      const fromHeader = full.headers?.from || full.from || item.from
      const { email: fromEmail, name: fromName } = parseFromHeader(fromHeader)
      const to = (full.to || item.to || []).map(String)
      const result = await recordInboundEmail({
        fromEmail,
        fromName,
        to,
        subject: full.subject || item.subject || '(No subject)',
        bodyHtml: full.html || undefined,
        bodyText: full.text || undefined,
        messageId: full.message_id || item.message_id,
        resendEmailId: item.id,
      })
      if (result) imported++
      else skipped++
    } catch (e) {
      console.error('syncInboundFromResend item error:', item.id, e)
    }
  }

  return { imported, skipped, total: items.length }
}

export async function sendStaffEmail(input: {
  to: string | string[]
  cc?: string
  bcc?: string
  subject: string
  bodyHtml: string
  bodyText?: string
  fromAccountId?: string
  threadId?: string
  inReplyTo?: string
  references?: string[]
  sentByUserId?: string
  sentByUserName?: string
  attachments?: EmailAttachment[]
  userId?: string
  userRole?: string
}) {
  const settings = await getEmailCenterSettings()
  const account =
    settings.accounts.find((a) => a.id === input.fromAccountId) ||
    settings.accounts.find((a) => a.isDefault) ||
    settings.accounts[0]

  if (!account) throw new Error('No email account configured. Add one in Email settings.')

  if (input.userId && input.userRole) {
    if (!canAccessAccount(settings.accounts, account.id, input.userId, input.userRole)) {
      throw new Error('You do not have permission to send from this email account')
    }
  }

  const fromEmail = account.email
  const fromName = account.name || 'Isle & Echo'
  const to = normalizeEmailList(input.to)
  const cc = normalizeEmailList(input.cc)
  const bcc = normalizeEmailList(input.bcc)
  const backup = backupAddress(account)
  if (
    account.forwardOutbound &&
    backup &&
    !to.some((addr) => parseEmailAddress(addr) === backup) &&
    !cc.some((addr) => parseEmailAddress(addr) === backup) &&
    !bcc.some((addr) => parseEmailAddress(addr) === backup)
  ) {
    bcc.push(backup)
  }
  if (!to.length) throw new Error('At least one recipient is required')

  const messageId = `<${randomUUID()}@isleandecho.local>`
  const now = new Date().toISOString()
  const bodyText = input.bodyText || input.bodyHtml.replace(/<[^>]+>/g, ' ')

  await sendEmail({
    to,
    subject: input.subject,
    html: input.bodyHtml,
    text: bodyText,
    replyTo: fromEmail,
    from: formatEmailFrom(fromName, fromEmail),
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    attachments: input.attachments?.map((file) => ({
      filename: file.filename,
      contentType: file.contentType,
      url: file.url,
    })),
  })

  const threads = await loadThreads()
  const messages = await loadMessages()
  let thread: EmailThread

  if (input.threadId) {
    const existing = threads.find((t) => t.id === input.threadId)
    if (!existing) throw new Error('Thread not found')
    thread = {
      ...existing,
      subject: input.subject,
      lastMessageAt: now,
      lastPreview: preview(bodyText),
      lastFromName: fromName,
      lastFromEmail: fromEmail,
      updatedAt: now,
      folder: existing.folder === 'trash' ? 'sent' : existing.folder,
    }
    const idx = threads.findIndex((t) => t.id === thread.id)
    threads[idx] = thread
  } else {
    thread = {
      id: randomUUID(),
      subject: input.subject,
      accountEmail: fromEmail,
      participants: [...new Set([fromEmail.toLowerCase(), ...to.map((e) => e.toLowerCase())])],
      folder: 'sent',
      starred: false,
      unreadCount: 0,
      lastMessageAt: now,
      lastPreview: preview(bodyText),
      lastFromName: fromName,
      lastFromEmail: fromEmail,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
    threads.push(thread)
  }

  const message: EmailMessage = {
    id: randomUUID(),
    threadId: thread.id,
    messageId,
    fromEmail,
    fromName,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText,
    direction: 'outbound',
    sentByUserId: input.sentByUserId,
    sentByUserName: input.sentByUserName,
    inReplyTo: input.inReplyTo,
    references: input.references,
    attachments: input.attachments?.length ? input.attachments : undefined,
    createdAt: now,
  }
  messages.push(message)
  await saveThreads(threads)
  await saveMessages(messages)
  return { thread, message }
}

export async function getEmailStats(accessibleEmails?: string[]) {
  let threads = await loadThreads()
  if (accessibleEmails) {
    threads = filterByAccessibleEmails(threads, accessibleEmails)
  }
  return {
    inbox: threads.filter((t) => t.folder === 'inbox').length,
    unread: threads.filter((t) => t.unreadCount > 0 && t.folder !== 'trash').length,
    starred: threads.filter((t) => t.starred && t.folder !== 'trash').length,
    sent: threads.filter((t) => t.folder === 'sent').length,
    trash: threads.filter((t) => t.folder === 'trash').length,
  }
}
