'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  MailOpen,
  Inbox,
  Send,
  Star,
  Trash2,
  PenSquare,
  Search,
  Settings,
  Reply,
  RotateCcw,
  Paperclip,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Layers,
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import type { EmailAccount, EmailAttachment, EmailMessage, EmailThread } from '@/lib/emailCenter'
import { useDashboardAccess } from '@/hooks/useDashboardAccess'
import { isSuperAdmin } from '@/lib/roles'
import {
  MAX_EMAIL_ATTACHMENT_BYTES,
  MAX_EMAIL_ATTACHMENTS,
  isImageAttachment,
  isPdfAttachment,
} from '@/lib/emailAttachments'

type Folder = 'all' | 'inbox' | 'unread' | 'read' | 'starred' | 'sent' | 'trash'

/** How many inbox accounts stay visible before Gmail-style More */
const INBOX_PREVIEW_COUNT = 4
/** Primary folders always shown; the rest sit behind More */
const PRIMARY_FOLDERS: Folder[] = ['all', 'inbox', 'unread', 'starred', 'sent']
const MORE_FOLDERS: Folder[] = ['read', 'trash']

type Stats = {
  all: number
  inbox: number
  unread: number
  read: number
  starred: number
  sent: number
  trash: number
}

function staffAuthHeaders(user: { id?: string; name?: string; role?: string } | null) {
  const h: HeadersInit = {}
  if (user?.id) h['x-user-id'] = user.id
  if (user?.name) h['x-user-name'] = user.name
  if (user?.role) h['x-user-role'] = user.role
  return h
}

function staffHeaders(user: { id?: string; name?: string; role?: string } | null) {
  return { ...staffAuthHeaders(user), 'Content-Type': 'application/json' }
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function defaultAccountId(accounts: EmailAccount[]) {
  return accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ''
}

function accountIdForEmail(accounts: EmailAccount[], email: string) {
  const normalized = email.trim().toLowerCase()
  return accounts.find((a) => a.email.toLowerCase() === normalized)?.id || defaultAccountId(accounts)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function AdminEmailPage() {
  const { user } = useAuth()
  const { canAccess, loaded: accessLoaded } = useDashboardAccess()
  const hasEmailAccess = canAccess('email')
  const canManageAccounts = isSuperAdmin(user?.role)
  const [folder, setFolder] = useState<Folder>('all')
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [stats, setStats] = useState<Stats>({
    all: 0,
    inbox: 0,
    unread: 0,
    read: 0,
    starred: 0,
    sent: 0,
    trash: 0,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const [accountFilter, setAccountFilter] = useState('')
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedThreadCache, setSelectedThreadCache] = useState<EmailThread | null>(null)
  const [inboxesExpanded, setInboxesExpanded] = useState(false)
  const [foldersExpanded, setFoldersExpanded] = useState(false)

  const [compose, setCompose] = useState({
    fromAccountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    threadId: '' as string | undefined,
    inReplyTo: '' as string | undefined,
  })
  const [composeFiles, setComposeFiles] = useState<File[]>([])
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null)

  const selectedThread = useMemo(() => {
    const fromList = threads.find((t) => t.id === selectedId)
    if (fromList) return fromList
    if (selectedThreadCache && selectedThreadCache.id === selectedId) return selectedThreadCache
    return null
  }, [threads, selectedId, selectedThreadCache])

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const params = new URLSearchParams({ folder })
      if (search.trim()) params.set('search', search.trim())
      if (accountFilter) params.set('account', accountFilter)
      const res = await fetch(`/api/emails?${params}`, {
        credentials: 'include',
        headers: staffHeaders(user),
      })
      const json = await res.json()
      if (json.success) {
        setThreads(json.data.threads || [])
        setStats(
          json.data.stats || {
            all: 0,
            inbox: 0,
            unread: 0,
            read: 0,
            starred: 0,
            sent: 0,
            trash: 0,
          }
        )
        const loadedAccounts: EmailAccount[] = json.data.accounts || []
        setAccounts(loadedAccounts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [folder, search, accountFilter, user])

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/emails/${id}`, {
        credentials: 'include',
        headers: staffHeaders(user),
      })
      const json = await res.json()
      if (json.success) {
        const thread = json.data.thread as EmailThread | undefined
        if (thread) setSelectedThreadCache({ ...thread, unreadCount: 0 })
        setMessages(json.data.messages || [])
        setSelectedId(id)
        setMobileShowThread(true)
        await loadThreads({ silent: true })
      }
    } finally {
      setLoadingThread(false)
    }
  }, [user, loadThreads])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  const syncInbox = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      if (!silent) setSyncing(true)
      try {
        const res = await fetch('/api/emails/sync', {
          method: 'POST',
          credentials: 'include',
          headers: staffHeaders(user),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Sync failed')
        const { imported, skipped, total } = json.data || {}
        await loadThreads()
        if (silent) return
        if (imported > 0) {
          alert(`Synced ${imported} new email${imported === 1 ? '' : 's'} from Resend.`)
        } else if (total === 0) {
          alert(
            'No received emails found in Resend yet. Check that inbound receiving is enabled for your domain.'
          )
        } else {
          alert(`No new emails (${skipped || total} already in inbox).`)
        }
      } catch (e) {
        if (!silent) {
          alert(e instanceof Error ? e.message : 'Failed to sync inbox')
        } else {
          console.error('Auto sync failed:', e)
        }
      } finally {
        if (!silent) setSyncing(false)
      }
    },
    [user, loadThreads]
  )

  // Auto-sync on open, then every 60s while Email Center is open
  const syncInboxRef = useRef(syncInbox)
  syncInboxRef.current = syncInbox
  useEffect(() => {
    if (!user?.id) return
    void syncInboxRef.current({ silent: true })
    const timer = window.setInterval(() => {
      void syncInboxRef.current({ silent: true })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [user?.id])

  const patchThread = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/emails/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: staffHeaders(user),
      body: JSON.stringify(body),
    })
    await loadThreads()
  }

  const setThreadUnread = async (id: string, unread: boolean) => {
    await patchThread(id, unread ? { unread: true } : { read: true })
    setSelectedThreadCache((prev) =>
      prev && prev.id === id ? { ...prev, unreadCount: unread ? Math.max(1, prev.unreadCount || 1) : 0 } : prev
    )
  }

  const restoreFromTrash = async (id: string) => {
    await patchThread(id, { restore: true })
    setSelectedId(null)
    setMobileShowThread(false)
  }

  const deleteForever = async (id: string) => {
    if (!confirm('Delete this email forever? This cannot be undone.')) return
    await fetch(`/api/emails/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: staffHeaders(user),
    })
    setSelectedId(null)
    setMobileShowThread(false)
    setMessages([])
    await loadThreads()
  }

  const emptyTrashFolder = async () => {
    if (!confirm('Permanently delete all emails in Trash? This cannot be undone.')) return
    await fetch('/api/emails', {
      method: 'DELETE',
      credentials: 'include',
      headers: staffHeaders(user),
    })
    setSelectedId(null)
    setMobileShowThread(false)
    setMessages([])
    await loadThreads()
  }

  const openCompose = (reply?: { thread: EmailThread; lastMessage?: EmailMessage }) => {
    const fromId = reply
      ? accountIdForEmail(accounts, reply.thread.accountEmail)
      : defaultAccountId(accounts)
    if (reply) {
      setCompose({
        fromAccountId: fromId,
        to: reply.thread.lastFromEmail,
        cc: '',
        bcc: '',
        subject: reply.thread.subject.startsWith('Re:') ? reply.thread.subject : `Re: ${reply.thread.subject}`,
        body: `\n\n---\nOn ${formatTime(reply.lastMessage?.createdAt || reply.thread.lastMessageAt)}, ${reply.lastMessage?.fromName || reply.thread.lastFromName} wrote:\n${reply.lastMessage?.bodyText || reply.thread.lastPreview}`,
        threadId: reply.thread.id,
        inReplyTo: reply.lastMessage?.messageId,
      })
    } else {
      setCompose({
        fromAccountId: fromId,
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        threadId: undefined,
        inReplyTo: undefined,
      })
    }
    setComposeFiles([])
    setComposeOpen(true)
  }

  const addComposeFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next = [...composeFiles]
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_EMAIL_ATTACHMENT_BYTES) {
        alert(`${file.name} is larger than 4MB`)
        continue
      }
      if (next.length >= MAX_EMAIL_ATTACHMENTS) {
        alert(`You can attach up to ${MAX_EMAIL_ATTACHMENTS} files`)
        break
      }
      if (next.some((existing) => existing.name === file.name && existing.size === file.size)) continue
      next.push(file)
    }
    setComposeFiles(next)
  }

  const handleSend = async () => {
    if (!compose.to.trim() || !compose.subject.trim()) {
      alert('To and subject are required')
      return
    }
    if (!compose.fromAccountId) {
      alert('Please choose which email account to send from')
      return
    }
    setSending(true)
    try {
      const uploaded: EmailAttachment[] = []
      for (const file of composeFiles) {
        const form = new FormData()
        form.append('file', file)
        const uploadRes = await fetch('/api/emails/upload', {
          method: 'POST',
          credentials: 'include',
          headers: staffAuthHeaders(user),
          body: form,
        })
        const uploadJson = await uploadRes.json()
        if (!uploadJson.success) throw new Error(uploadJson.error || `Failed to upload ${file.name}`)
        uploaded.push(uploadJson.data as EmailAttachment)
      }

      const bodyHtml = compose.body
        .split('\n')
        .map((line) => (line.trim() === '' ? '<br>' : `<p>${line.replace(/</g, '&lt;')}</p>`))
        .join('')
      const res = await fetch('/api/emails', {
        method: 'POST',
        credentials: 'include',
        headers: staffHeaders(user),
        body: JSON.stringify({
          fromAccountId: compose.fromAccountId,
          to: compose.to,
          cc: compose.cc,
          bcc: compose.bcc,
          subject: compose.subject,
          bodyHtml,
          bodyText: compose.body,
          threadId: compose.threadId,
          inReplyTo: compose.inReplyTo,
          attachments: uploaded,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Send failed')
      setComposeOpen(false)
      setComposeFiles([])
      setFolder('sent')
      await loadThreads()
      if (json.data?.thread?.id) await loadThread(json.data.thread.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (accessLoaded && !hasEmailAccess) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Email Center</h1>
        <p className="mt-2 text-gray-600">You do not have access to Email Center. Ask Super Admin to enable it for your role.</p>
      </div>
    )
  }

  const navItems: { id: Folder; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: 'all', label: 'All', icon: Layers, count: stats.all },
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.inbox },
    { id: 'unread', label: 'Unread', icon: Mail, count: stats.unread },
    { id: 'read', label: 'Read', icon: MailOpen, count: stats.read },
    { id: 'starred', label: 'Starred', icon: Star, count: stats.starred },
    { id: 'sent', label: 'Sent', icon: Send, count: stats.sent },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trash },
  ]

  const navById = useMemo(() => new Map(navItems.map((item) => [item.id, item])), [navItems])
  const primaryFolderItems = PRIMARY_FOLDERS.map((id) => navById.get(id)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  )
  const moreFolderItems = MORE_FOLDERS.map((id) => navById.get(id)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  )
  const displayedMoreFolders = foldersExpanded
    ? moreFolderItems
    : moreFolderItems.filter((item) => item.id === folder)

  const visibleAccounts = accounts.slice(0, INBOX_PREVIEW_COUNT)
  const hiddenAccounts = accounts.slice(INBOX_PREVIEW_COUNT)
  const pinnedHiddenInbox = !inboxesExpanded
    ? hiddenAccounts.filter((acc) => acc.email === accountFilter)
    : []
  const displayedAccounts = inboxesExpanded
    ? accounts
    : [...visibleAccounts, ...pinnedHiddenInbox]
  const inboxesNeedMore = hiddenAccounts.length > 0

  const selectInbox = (email: string) => {
    setAccountFilter(email)
    setSelectedId(null)
    setSelectedThreadCache(null)
    setMessages([])
    setMobileShowThread(false)
  }

  const selectFolder = (id: Folder) => {
    setFolder(id)
    setSelectedId(null)
    setSelectedThreadCache(null)
    setMessages([])
    setMobileShowThread(false)
  }

  const renderFolderButton = (item: (typeof navItems)[number]) => (
    <button
      key={item.id}
      type="button"
      onClick={() => selectFolder(item.id)}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
        folder === item.id ? 'bg-teal-50 text-teal-800' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="flex items-center gap-2">
        <item.icon className="h-4 w-4" />
        {item.label}
      </span>
      {item.count ? (
        <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs text-white">{item.count}</span>
      ) : null}
    </button>
  )

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-teal-700" />
          <h1 className="text-lg font-bold text-gray-900">Email Center</h1>
        </div>
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadThreads()}
            placeholder="Search emails…"
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => syncInbox()}
          disabled={syncing}
          className="rounded-lg px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-60"
          title="Pull new mail from Resend (also runs automatically every minute)"
        >
          {syncing ? 'Syncing…' : 'Sync inbox'}
        </button>
        <Link
          href="/admin/email/settings"
          className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${!canManageAccounts ? 'hidden' : ''}`}
          aria-label="Email settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => openCompose()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar — Gmail-style More / Less */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-gray-100 p-3 md:block">
          {accounts.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Inboxes</p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectInbox('')}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium ${
                    !accountFilter ? 'bg-teal-50 text-teal-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All inboxes
                </button>
                {(displayedAccounts).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => selectInbox(acc.email)}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm ${
                      accountFilter === acc.email ? 'bg-teal-50 text-teal-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-full truncate font-medium">{acc.name}</span>
                    <span className="w-full truncate text-xs text-gray-500">{acc.email}</span>
                  </button>
                ))}
                {inboxesNeedMore ? (
                  <button
                    type="button"
                    onClick={() => setInboxesExpanded((v) => !v)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    aria-expanded={inboxesExpanded}
                  >
                    {inboxesExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        More
                        <span className="text-xs font-normal text-gray-400">
                          ({hiddenAccounts.length})
                        </span>
                      </>
                    )}
                  </button>
                ) : null}
              </nav>
            </div>
          )}
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Folders</p>
          <nav className="space-y-1">
            {primaryFolderItems.map(renderFolderButton)}
            {displayedMoreFolders.map(renderFolderButton)}
            {moreFolderItems.length > 0 ? (
              <button
                type="button"
                onClick={() => setFoldersExpanded((v) => !v)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                aria-expanded={foldersExpanded}
              >
                {foldersExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    More
                  </>
                )}
              </button>
            ) : null}
          </nav>
        </aside>

        {/* Thread list */}
        <div
          className={`w-full shrink-0 border-r border-gray-100 md:w-80 lg:w-96 ${
            mobileShowThread ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="flex gap-1 overflow-x-auto border-b border-gray-100 p-2 md:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFolder(item.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  folder === item.id ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
            ) : accounts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No email inboxes are available for your account.
                {canManageAccounts ? (
                  <>
                    {' '}
                    <Link href="/admin/email/settings" className="text-teal-700 underline">
                      Assign email accounts to users
                    </Link>
                  </>
                ) : (
                  ' Ask Super Admin to assign an inbox to your user.'
                )}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No emails in this folder.</div>
            ) : (
              <>
                {folder === 'trash' ? (
                  <div className="flex justify-end border-b border-gray-50 px-4 py-2">
                    <button
                      type="button"
                      onClick={emptyTrashFolder}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Empty trash
                    </button>
                  </div>
                ) : null}
                <ul>
                  {threads.map((thread) => (
                    <li key={thread.id} className="group relative border-b border-gray-50">
                      <button
                        type="button"
                        onClick={() => loadThread(thread.id)}
                        className={`w-full px-4 py-3 pr-20 text-left transition hover:bg-gray-50 ${
                          selectedId === thread.id ? 'bg-teal-50/80' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`flex min-w-0 items-center gap-2 truncate text-sm ${
                              thread.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                            }`}
                          >
                            {thread.unreadCount > 0 ? (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-teal-600"
                                aria-label="Unread"
                              />
                            ) : null}
                            <span className="truncate">{thread.lastFromName || thread.lastFromEmail}</span>
                          </p>
                          <span className="shrink-0 text-xs text-gray-400">{formatTime(thread.lastMessageAt)}</span>
                        </div>
                        <p
                          className={`truncate text-sm ${
                            thread.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-700'
                          }`}
                        >
                          {thread.subject}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{thread.lastPreview}</p>
                      </button>
                      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        {thread.unreadCount > 0 ? (
                          <button
                            type="button"
                            title="Mark as read"
                            aria-label="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation()
                              void setThreadUnread(thread.id, false)
                            }}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm hover:bg-teal-50 hover:text-teal-800"
                          >
                            <MailOpen className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Mark as unread"
                            aria-label="Mark as unread"
                            onClick={(e) => {
                              e.stopPropagation()
                              void setThreadUnread(thread.id, true)
                            }}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm hover:bg-teal-50 hover:text-teal-800"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Reading pane */}
        <div
          className={`min-w-0 flex-1 flex flex-col ${
            mobileShowThread ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
              <Mail className="mb-3 h-12 w-12" />
              <p className="text-sm">Select an email to read</p>
            </div>
          ) : loadingThread ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Loading…</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
                <button
                  type="button"
                  className="md:hidden rounded-lg p-2 hover:bg-gray-100"
                  onClick={() => setMobileShowThread(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900">
                  {selectedThread.subject}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    patchThread(selectedThread.id, { starred: !selectedThread.starred })
                  }
                  className="rounded-lg p-2 hover:bg-gray-100"
                  title={selectedThread.starred ? 'Unstar' : 'Star'}
                >
                  <Star
                    className={`h-4 w-4 ${selectedThread.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`}
                  />
                </button>
                {selectedThread.unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void setThreadUnread(selectedThread.id, false)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    title="Mark as read"
                  >
                    <MailOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setThreadUnread(selectedThread.id, true)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    title="Mark as unread"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark unread</span>
                  </button>
                )}
                {selectedThread.folder === 'trash' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => restoreFromTrash(selectedThread.id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteForever(selectedThread.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete forever
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openCompose({ thread: selectedThread, lastMessage: messages[messages.length - 1] })}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => patchThread(selectedThread.id, { folder: 'trash' })}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Move to trash"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-4 ${
                      msg.direction === 'outbound' ? 'border-teal-100 bg-teal-50/40 ml-4' : 'border-gray-100 bg-white mr-4'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-900">{msg.fromName}</span>
                        <span className="text-gray-500"> &lt;{msg.fromEmail}&gt;</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="mb-2 text-xs text-gray-500">To: {msg.to.join(', ')}</p>
                    <div
                      className="prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: msg.bodyHtml || msg.bodyText.replace(/\n/g, '<br>') }}
                    />
                    {msg.attachments?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.attachments.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              if (!a.url) {
                                alert('This attachment is not available yet.')
                                return
                              }
                              if (isImageAttachment(a) || isPdfAttachment(a)) {
                                setPreviewAttachment(a)
                                return
                              }
                              window.open(a.url, '_blank', 'noopener,noreferrer')
                            }}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100"
                          >
                            {isImageAttachment(a) ? (
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">{a.filename}</span>
                            {a.size ? (
                              <span className="shrink-0 text-gray-400">{formatFileSize(a.size)}</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-gray-900">
                {compose.threadId ? 'Reply' : 'New message'}
              </h3>
              <button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">From</span>
                <select
                  value={compose.fromAccountId}
                  onChange={(e) => setCompose({ ...compose, fromAccountId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {accounts.length === 0 ? (
                    <option value="">No accounts available</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} &lt;{acc.email}&gt;
                      </option>
                    ))
                  )}
                </select>
              </label>
              <input
                placeholder="To"
                value={compose.to}
                onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="CC"
                value={compose.cc}
                onChange={(e) => setCompose({ ...compose, cc: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="BCC"
                value={compose.bcc}
                onChange={(e) => setCompose({ ...compose, bcc: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Subject"
                value={compose.subject}
                onChange={(e) => setCompose({ ...compose, subject: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm font-medium"
              />
              <textarea
                placeholder="Write your message…"
                value={compose.body}
                onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                rows={12}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              {composeFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {composeFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-800"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-400">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => setComposeFiles(composeFiles.filter((_, i) => i !== index))}
                        className="rounded p-0.5 hover:bg-gray-200"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50">
                <Paperclip className="h-4 w-4" />
                Attach files
                <span className="hidden text-xs font-normal text-gray-400 sm:inline">up to 4MB each</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addComposeFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposeOpen(false)
                    setComposeFiles([])
                  }}
                  className="rounded-xl border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? (composeFiles.length ? 'Uploading…' : 'Sending…') : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewAttachment?.url && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">{previewAttachment.filename}</p>
              <div className="flex items-center gap-1">
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewAttachment.filename}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-gray-50 p-4">
              {isImageAttachment(previewAttachment) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.filename}
                  className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
                />
              ) : (
                <iframe
                  title={previewAttachment.filename}
                  src={previewAttachment.url}
                  className="h-[72vh] w-full rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
