'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, Users, Shield, UserCheck } from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import type { EmailAccount } from '@/lib/emailCenter'
import { isSuperAdmin, roleLabel } from '@/lib/roles'

const EMAIL_DOMAIN = 'isleandecho.com'

type StaffUser = {
  id: string
  name: string
  email: string
  role: string
  status?: string
}

function staffHeaders(user: { id?: string; name?: string; role?: string } | null) {
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (user?.id) h['x-user-id'] = user.id
  if (user?.name) h['x-user-name'] = user.name
  if (user?.role) h['x-user-role'] = user.role
  return h
}

function emailLocalPart(email: string) {
  if (!email) return ''
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

export default function EmailSettingsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const allowed = isSuperAdmin(user?.role)

  useEffect(() => {
    if (!allowed) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/emails/settings', { credentials: 'include', headers: staffHeaders(user) }).then((r) => r.json()),
      fetch('/api/users', { credentials: 'include', headers: staffHeaders(user) }).then((r) => r.json()),
    ])
      .then(([settingsRes, usersRes]) => {
        if (settingsRes.success && settingsRes.data) {
          setAccounts(settingsRes.data.accounts || [])
          setWebhookSecret(settingsRes.data.resendWebhookSecret || '')
        }
        const usersRaw = usersRes
        const users: StaffUser[] = Array.isArray(usersRaw)
          ? usersRaw
          : usersRaw?.users || usersRaw?.data || []
        setStaffUsers(
          users.filter(
            (u) =>
              (u.role === 'super_admin' || u.role === 'admin' || u.role === 'staff') &&
              u.status !== 'inactive'
          )
        )
      })
      .finally(() => setLoading(false))
  }, [allowed, user])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/emails/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: staffHeaders(user),
        body: JSON.stringify({ accounts, resendWebhookSecret: webhookSecret }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      alert('Email access saved. Each user will only see the inboxes assigned to them.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addAccount = () => {
    setAccounts([
      ...accounts,
      {
        id: `acc_${Date.now()}`,
        name: 'New account',
        email: '',
        isActive: true,
        assignedUserIds: [],
        backupEmail: '',
        forwardInbound: false,
        forwardOutbound: false,
      },
    ])
  }

  const toggleStaff = (accountIndex: number, userId: string) => {
    const next = [...accounts]
    const acc = next[accountIndex]
    const current = (acc.assignedUserIds || []).map(String)
    const assignedUserIds = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    next[accountIndex] = { ...acc, assignedUserIds }
    setAccounts(next)
  }

  const assignOnlyUser = (accountIndex: number, userId: string) => {
    const next = [...accounts]
    next[accountIndex] = { ...next[accountIndex], assignedUserIds: [userId] }
    setAccounts(next)
  }

  const matchingUsersByAccount = useMemo(() => {
    const map = new Map<string, StaffUser[]>()
    for (const acc of accounts) {
      const mailbox = String(acc.email || '').trim().toLowerCase()
      const matches = staffUsers.filter((su) => String(su.email || '').trim().toLowerCase() === mailbox)
      map.set(acc.id, matches)
    }
    return map
  }, [accounts, staffUsers])

  if (loading) {
    return <div className="p-8 text-gray-500">Loading email settings…</div>
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <p className="text-gray-600">Only Super Admin can decide which users can open each email account.</p>
        <Link href="/admin/email" className="mt-4 inline-block text-teal-700 underline">
          Back to Email Center
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email account access</h1>
          <p className="text-sm text-gray-600">
            Choose exactly which authenticated users can open each inbox. Personal mailboxes should be assigned to
            that person only. Shared addresses like <strong>info@{EMAIL_DOMAIN}</strong> can be given to Admin and
            Super Admin.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        <p className="font-semibold mb-1">How access works</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Super Admin always sees every inbox (for management).</li>
          <li>Admin / Staff only see inboxes you tick for them below.</li>
          <li>Those users must also have the Email section enabled under Access control.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Email accounts</h2>
          <button
            type="button"
            onClick={addAccount}
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add address
          </button>
        </div>
        {accounts.length === 0 && (
          <p className="text-sm text-gray-500">
            No accounts yet. Add a shared one like <strong>info@{EMAIL_DOMAIN}</strong> or a personal one like{' '}
            <strong>hashantha@{EMAIL_DOMAIN}</strong>.
          </p>
        )}
        {accounts.map((acc, i) => {
          const matches = matchingUsersByAccount.get(acc.id) || []
          const assignedCount = (acc.assignedUserIds || []).length
          return (
            <div key={acc.id} className="space-y-3 rounded-xl border border-gray-100 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={acc.name}
                  onChange={(e) => {
                    const next = [...accounts]
                    next[i] = { ...acc, name: e.target.value }
                    setAccounts(next)
                  }}
                  placeholder="Display name (e.g. Info Desk or Hashantha)"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
                <div className="flex rounded-lg border overflow-hidden">
                  <input
                    value={emailLocalPart(acc.email)}
                    onChange={(e) => {
                      const local = e.target.value.replace(/[@\s]/g, '').toLowerCase()
                      const next = [...accounts]
                      next[i] = { ...acc, email: local ? `${local}@${EMAIL_DOMAIN}` : '' }
                      setAccounts(next)
                    }}
                    placeholder="username"
                    className="flex-1 border-0 px-3 py-2 text-sm focus:ring-0"
                  />
                  <span className="flex items-center bg-gray-50 px-3 text-sm text-gray-500">@{EMAIL_DOMAIN}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acc.isDefault || false}
                  onChange={(e) => {
                    const next = accounts.map((a, idx) => ({
                      ...a,
                      isDefault: idx === i ? e.target.checked : false,
                    }))
                    setAccounts(next)
                  }}
                />
                Default send-from address
              </label>

              <div className="rounded-xl bg-gray-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1 text-sm font-medium text-gray-800">
                    <Users className="h-4 w-4" />
                    Users who can open this inbox
                    <span className="font-normal text-gray-500">({assignedCount} selected)</span>
                  </p>
                  {matches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => assignOnlyUser(i, matches[0].id)}
                      className="inline-flex items-center gap-1 rounded-full border border-teal-600 bg-white px-3 py-1 text-xs font-semibold text-teal-800"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Personal only: {matches[0].name}
                    </button>
                  )}
                </div>

                {staffUsers.length === 0 ? (
                  <p className="text-xs text-gray-500">No dashboard users found. Add them in Users first.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {staffUsers.map((su) => {
                      const checked = (acc.assignedUserIds || []).map(String).includes(su.id)
                      const sameEmail =
                        String(su.email || '').trim().toLowerCase() ===
                        String(acc.email || '').trim().toLowerCase()
                      return (
                        <label
                          key={su.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                            checked ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 accent-teal-700"
                            checked={checked}
                            onChange={() => toggleStaff(i, su.id)}
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-gray-900">{su.name}</span>
                            <span className="block truncate text-xs text-gray-500">{su.email}</span>
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                              {roleLabel(su.role)}
                              {sameEmail ? (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">
                                  matches mailbox
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Example: assign <strong>info@{EMAIL_DOMAIN}</strong> to Admin + Super Admin. Assign a personal
                  mailbox only to that one user so nobody else can open it.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAccounts(accounts.filter((_, idx) => idx !== i))}
                className="inline-flex items-center gap-1 text-sm text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Remove account
              </button>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Resend setup:</strong> Each address must be verified in Resend. Inbound mail should route to{' '}
        <code className="rounded bg-white px-1">/api/webhooks/resend</code>.
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Resend inbound webhook</h2>
        <p className="text-sm text-gray-600">
          Optional secret to verify inbound webhook requests from Resend.
        </p>
        <input
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder="RESEND_WEBHOOK_SECRET (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save account access'}
      </button>
    </div>
  )
}
