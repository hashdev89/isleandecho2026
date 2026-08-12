'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  PenSquare,
  Search,
  RefreshCw,
  Settings,
  Reply,
  Archive,
  Paperclip,
  X,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import type { EmailAccount, EmailMessage, EmailThread } from '@/lib/emailCenter'

type Folder = 'inbox' | 'unread' | 'starred' | 'sent' | 'trash' | 'all'

type Stats = { inbox: number; unread: number; starred: number; sent: number; trash: number }

function staffHeaders(user: { id?: string; name?: string; role?: string } | null) {
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (user?.id) h['x-user-id'] = user.id
  if (user?.name) h['x-user-name'] = user.name
  if (user?.role) h['x-user-role'] = user.role
  return h
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
  const [folder, setFolder] = useState<Folder>('inbox')
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [stats, setStats] = useState<Stats>({ inbox: 0, unread: 0, starred: 0, sent: 0, trash: 0 })
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

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedId) || null,
    [threads, selectedId]
  )

  const loadThreads = useCallback(async () => {
    setLoading(true)
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
        setStats(json.data.stats || { inbox: 0, unread: 0, starred: 0, sent: 0, trash: 0 })
        const loadedAccounts: EmailAccount[] = json.data.accounts || []
        setAccounts(loadedAccounts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
        setMessages(json.data.messages || [])
        setSelectedId(id)
        setMobileShowThread(true)
        setThreads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t))
        )
      }
    } finally {
      setLoadingThread(false)
    }
  }, [user])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  const patchThread = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/emails/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: staffHeaders(user),
      body: JSON.stringify(body),
    })
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
    setComposeOpen(true)
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
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Send failed')
      setComposeOpen(false)
      setFolder('sent')
      await loadThreads()
      if (json.data?.thread?.id) await loadThread(json.data.thread.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const syncInbox = async () => {
    setSyncing(true)
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
      if (imported > 0) {
        alert(`Synced ${imported} new email${imported === 1 ? '' : 's'} from Resend.`)
      } else if (total === 0) {
        alert('No received emails found in Resend yet. Check that inbound receiving is enabled for your domain.')
      } else {
        alert(`No new emails (${skipped || total} already in inbox).`)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to sync inbox')
    } finally {
      setSyncing(false)
    }
  }

  const navItems: { id: Folder; label: string; icon: typeof Inbox; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.unread },
    { id: 'unread', label: 'Unread', icon: Mail, count: stats.unread },
    { id: 'starred', label: 'Starred', icon: Star, count: stats.starred },
    { id: 'sent', label: 'Sent', icon: Send, count: stats.sent },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trash },
  ]

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
        >
          {syncing ? 'Syncing…' : 'Sync inbox'}
        </button>
        <button
          type="button"
          onClick={() => loadThreads()}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link
          href="/admin/email/settings"
          className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${user?.role !== 'admin' ? 'hidden' : ''}`}
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
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 border-r border-gray-100 p-3 md:block">
          {accounts.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Inboxes</p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setAccountFilter('')
                    setSelectedId(null)
                    setMessages([])
                    setMobileShowThread(false)
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium ${
                    !accountFilter ? 'bg-teal-50 text-teal-800' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All inboxes
                </button>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setAccountFilter(acc.email)
                      setSelectedId(null)
                      setMessages([])
                      setMobileShowThread(false)
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm ${
                      accountFilter === acc.email ? 'bg-teal-50 text-teal-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium truncate w-full">{acc.name}</span>
                    <span className="truncate text-xs text-gray-500 w-full">{acc.email}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Folders</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFolder(item.id)
                  setSelectedId(null)
                  setMessages([])
                  setMobileShowThread(false)
                }}
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
            ))}
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
                No email inboxes assigned to your account.
                {user?.role === 'admin' ? (
                  <>
                    {' '}
                    <Link href="/admin/email/settings" className="text-teal-700 underline">
                      Add email accounts
                    </Link>
                  </>
                ) : (
                  ' Ask an admin to assign you to an inbox.'
                )}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No emails in this folder.</div>
            ) : (
              <ul>
                {threads.map((thread) => (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => loadThread(thread.id)}
                      className={`w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        selectedId === thread.id ? 'bg-teal-50/80' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            thread.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                          }`}
                        >
                          {thread.lastFromName || thread.lastFromEmail}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">{formatTime(thread.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-sm text-gray-700">{thread.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{thread.lastPreview}</p>
                    </button>
                  </li>
                ))}
              </ul>
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
                >
                  <Star
                    className={`h-4 w-4 ${selectedThread.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`}
                  />
                </button>
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
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs"
                          >
                            <Paperclip className="h-3 w-3" />
                            {a.filename}
                          </span>
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
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
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
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
