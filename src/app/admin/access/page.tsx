'use client'

import { useEffect, useMemo, useState } from 'react'
import { Shield, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { isSuperAdmin, roleLabel } from '@/lib/roles'
import {
  ASSIGNABLE_DASHBOARD_ROLES,
  DASHBOARD_SECTIONS,
  DEFAULT_DASHBOARD_ACCESS,
  type AssignableDashboardRole,
  type DashboardAccessMatrix,
  type DashboardSectionId,
} from '@/lib/dashboardAccess'

function staffHeaders(user: { id?: string; name?: string; role?: string } | null) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (user?.id) headers['x-user-id'] = user.id
  if (user?.name) headers['x-user-name'] = user.name
  if (user?.role) headers['x-user-role'] = user.role
  return headers
}

export default function DashboardAccessPage() {
  const { user } = useAuth()
  const [matrix, setMatrix] = useState<DashboardAccessMatrix>(DEFAULT_DASHBOARD_ACCESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const allowed = isSuperAdmin(user?.role)
  const editableSections = useMemo(
    () => DASHBOARD_SECTIONS.filter((section) => section.id !== 'access-control'),
    []
  )

  useEffect(() => {
    if (!allowed) {
      setLoading(false)
      return
    }
    fetch('/api/dashboard-access', { credentials: 'include', headers: staffHeaders(user), cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.matrix) setMatrix(json.data.matrix)
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load access settings.' }))
      .finally(() => setLoading(false))
  }, [allowed, user])

  const toggle = (sectionId: DashboardSectionId, role: AssignableDashboardRole) => {
    setMatrix((prev) => {
      const current = prev[sectionId] || []
      const next = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
      return { ...prev, [sectionId]: next }
    })
    setMessage(null)
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/dashboard-access', {
        method: 'PUT',
        credentials: 'include',
        headers: staffHeaders(user),
        body: JSON.stringify({ matrix }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed')
      }
      if (json.data?.matrix) setMatrix(json.data.matrix)
      setMessage({ type: 'success', text: 'Dashboard access updated. Other roles will see the new menu after refresh.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <Shield className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-gray-600">Only Super Admin can change which dashboard sections other roles can see.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Super Admin</p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard access</h1>
          <p className="mt-1 max-w-2xl text-gray-600">
            Choose which sections Admin, Staff, and Customer can open. Super Admin always keeps every section, including Email.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save access
        </button>
      </div>

      {message ? (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Section</th>
              <th className="px-3 py-3 font-semibold text-center">Super Admin</th>
              {ASSIGNABLE_DASHBOARD_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 font-semibold text-center">
                  {roleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editableSections.map((section) => (
              <tr key={section.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{section.name}</div>
                  <div className="text-xs text-gray-500">{section.description}</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-teal-700 text-white">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                </td>
                {ASSIGNABLE_DASHBOARD_ROLES.map((role) => {
                  const checked = (matrix[section.id] || []).includes(role)
                  return (
                    <td key={role} className="px-3 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={loading}
                          onChange={() => toggle(section.id, role)}
                          className="h-4 w-4 accent-teal-700"
                          aria-label={`${section.name} for ${roleLabel(role)}`}
                        />
                      </label>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">Access control</div>
                <div className="text-xs text-gray-500">This page. Super Admin only.</div>
              </td>
              <td className="px-3 py-3 text-center">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-teal-700 text-white">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              </td>
              {ASSIGNABLE_DASHBOARD_ROLES.map((role) => (
                <td key={role} className="px-3 py-3 text-center text-gray-400">
                  —
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading current access…</p> : null}
    </div>
  )
}
