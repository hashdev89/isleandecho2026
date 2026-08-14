'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, Users } from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import type { EmailAccount } from '@/lib/emailCenter'
import { useDashboardAccess } from '@/hooks/useDashboardAccess'

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

  const { canAccess } = useDashboardAccess()
  const isAdmin = canAccess('email')

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/emails/settings', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/users', { credentials: 'include' }).then((r) => r.json()),
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
            (u) => (u.role === 'super_admin' || u.role === 'admin' || u.role === 'staff') && u.status !== 'inactive'
          )
        )
      })
      .finally(() => setLoading(false))
  }, [isAdmin])

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
      alert('Email settings saved')
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
      },
    ])
  }

  const toggleStaff = (accountIndex: number, userId: string) => {
    const next = [...accounts]
    const acc = next[accountIndex]
    const current = acc.assignedUserIds || []
    const assignedUserIds = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    next[accountIndex] = { ...acc, assignedUserIds }
    setAccounts(next)
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading email settings…</div>
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-gray-600">Only the Super Admin can manage email accounts and staff access.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Email settings</h1>
          <p className="text-sm text-gray-600">
            Create @{EMAIL_DOMAIN} addresses and assign staff who can send and receive from each inbox
          </p>
        </div>
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
            No accounts yet. Add one like <strong>hashantha@{EMAIL_DOMAIN}</strong> and assign team members below.
          </p>
        )}
        {accounts.map((acc, i) => (
          <div key={acc.id} className="space-y-3 rounded-xl border border-gray-100 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={acc.name}
                onChange={(e) => {
                  const next = [...accounts]
                  next[i] = { ...acc, name: e.target.value }
                  setAccounts(next)
                }}
                placeholder="Display name (e.g. Hashantha)"
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
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Staff with access to this inbox
              </p>
              {staffUsers.length === 0 ? (
                <p className="text-xs text-gray-500">No admin/staff users found. Add users in the Users section first.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {staffUsers.map((su) => {
                    const checked = (acc.assignedUserIds || []).includes(su.id)
                    return (
                      <label
                        key={su.id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                          checked ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleStaff(i, su.id)}
                        />
                        {su.name}
                        <span className="text-gray-400">({su.role})</span>
                      </label>
                    )
                  })}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Admins always see all inboxes. Assigned staff only see and send from accounts they are linked to.
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
        ))}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Resend setup:</strong> Each address (e.g. hashantha@{EMAIL_DOMAIN}) must be verified in your Resend
        dashboard under Domains before you can send from it. Inbound mail should route to{' '}
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
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  )
}
