'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { AdditionalCharge, RentalSettings } from '@/lib/vehicleTypes'

export default function RentalSettingsAdminPage() {
  const [settings, setSettings] = useState<RentalSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/rental-settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSettings(json.data)
      })
  }, [])

  const addCharge = () => {
    if (!settings) return
    setSettings({
      ...settings,
      additionalCharges: [
        ...settings.additionalCharges,
        { id: `charge-${Date.now()}`, label: 'New charge', amount: 0, type: 'flat', enabled: true },
      ],
    })
  }

  const updateCharge = (index: number, patch: Partial<AdditionalCharge>) => {
    if (!settings) return
    const next = [...settings.additionalCharges]
    next[index] = { ...next[index], ...patch }
    setSettings({ ...settings, additionalCharges: next })
  }

  const removeCharge = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      additionalCharges: settings.additionalCharges.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/rental-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')
      alert('Rental settings saved')
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return <div className="p-6">Loading settings…</div>
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/vehicles" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Rental settings</h1>
          <p className="text-gray-600 text-sm">Global defaults and optional extra charges shown to customers</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Road distance multiplier</label>
            <input type="number" step="0.05" value={settings.roadDistanceMultiplier} onChange={(e) => setSettings({ ...settings, roadDistanceMultiplier: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Applied to straight-line km (e.g. 1.25 ≈ road estimate)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default included km/day</label>
            <input type="number" value={settings.defaultIncludedKmPerDay} onChange={(e) => setSettings({ ...settings, defaultIncludedKmPerDay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default extra km rate</label>
            <input type="number" value={settings.defaultExtraKmRate} onChange={(e) => setSettings({ ...settings, defaultExtraKmRate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default one-way fee</label>
            <input type="number" value={settings.defaultOneWayFee} onChange={(e) => setSettings({ ...settings, defaultOneWayFee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Additional charges</h2>
            <button type="button" onClick={addCharge} className="inline-flex items-center gap-1 text-sm text-blue-600">
              <Plus className="w-4 h-4" /> Add charge
            </button>
          </div>
          <div className="space-y-3">
            {settings.additionalCharges.map((charge, index) => (
              <div key={charge.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center border border-gray-100 rounded-lg p-3">
                <input value={charge.label} onChange={(e) => updateCharge(index, { label: e.target.value })} className="sm:col-span-4 px-2 py-1.5 border rounded" placeholder="Label" />
                <input type="number" value={charge.amount} onChange={(e) => updateCharge(index, { amount: Number(e.target.value) })} className="sm:col-span-2 px-2 py-1.5 border rounded" placeholder="Amount" />
                <select value={charge.type} onChange={(e) => updateCharge(index, { type: e.target.value as AdditionalCharge['type'] })} className="sm:col-span-3 px-2 py-1.5 border rounded">
                  <option value="flat">Flat (once)</option>
                  <option value="per_day">Per day</option>
                  <option value="per_km">Per km</option>
                </select>
                <label className="sm:col-span-2 flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={charge.enabled !== false} onChange={(e) => updateCharge(index, { enabled: e.target.checked })} />
                  Active
                </label>
                <button type="button" onClick={() => removeCharge(index)} className="sm:col-span-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
