'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Vehicle, VehicleCategory, VehicleStatus } from '@/lib/vehicleTypes'

const CATEGORIES: VehicleCategory[] = ['economy', 'compact', 'midsize', 'suv', 'luxury', 'van', 'sports']
const STATUSES: VehicleStatus[] = ['active', 'draft', 'archived']

const emptyVehicle = (): Vehicle => ({
  id: '',
  name: '',
  category: 'economy',
  basePricePerDay: 8500,
  includedKmPerDay: 100,
  extraKmRate: 45,
  oneWayDropoffFee: 2500,
  seats: 5,
  transmission: 'Automatic',
  fuelType: 'Petrol',
  features: [],
  images: ['/placeholder-image.svg'],
  description: '',
  badge: '',
  status: 'draft',
  featured: false,
  rating: 0,
  reviews: 0,
})

export default function VehicleEditorPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.id as string
  const isNew = vehicleId === 'new'
  const [vehicle, setVehicle] = useState<Vehicle>(emptyVehicle())
  const [featureInput, setFeatureInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        const res = await fetch('/api/vehicles?all=true')
        const json = await res.json()
        if (json.success) {
          const found = (json.data || []).find((v: Vehicle) => v.id === vehicleId)
          if (found) setVehicle(found)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isNew, vehicleId])

  const addFeature = () => {
    const trimmed = featureInput.trim()
    if (!trimmed) return
    setVehicle((v) => ({ ...v, features: [...v.features, trimmed] }))
    setFeatureInput('')
  }

  const handleSave = async () => {
    if (!vehicle.name || !vehicle.basePricePerDay) {
      alert('Name and base price are required')
      return
    }
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Save failed')
      router.push('/admin/vehicles')
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/vehicles" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? 'Add vehicle' : `Edit: ${vehicle.name}`}</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={vehicle.name} onChange={(e) => setVehicle({ ...vehicle, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={vehicle.category} onChange={(e) => setVehicle({ ...vehicle, category: e.target.value as VehicleCategory })} className="w-full px-3 py-2 border rounded-lg">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base price per day (LKR)</label>
            <input type="number" value={vehicle.basePricePerDay} onChange={(e) => setVehicle({ ...vehicle, basePricePerDay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Included km per day</label>
            <input type="number" value={vehicle.includedKmPerDay} onChange={(e) => setVehicle({ ...vehicle, includedKmPerDay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Extra km rate (LKR/km)</label>
            <input type="number" value={vehicle.extraKmRate} onChange={(e) => setVehicle({ ...vehicle, extraKmRate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">One-way drop-off fee (LKR)</label>
            <input type="number" value={vehicle.oneWayDropoffFee ?? 0} onChange={(e) => setVehicle({ ...vehicle, oneWayDropoffFee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seats</label>
            <input type="number" value={vehicle.seats} onChange={(e) => setVehicle({ ...vehicle, seats: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={vehicle.status} onChange={(e) => setVehicle({ ...vehicle, status: e.target.value as VehicleStatus })} className="w-full px-3 py-2 border rounded-lg">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transmission</label>
            <input value={vehicle.transmission} onChange={(e) => setVehicle({ ...vehicle, transmission: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fuel type</label>
            <input value={vehicle.fuelType} onChange={(e) => setVehicle({ ...vehicle, fuelType: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Badge (optional)</label>
            <input value={vehicle.badge || ''} onChange={(e) => setVehicle({ ...vehicle, badge: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="featured" checked={vehicle.featured} onChange={(e) => setVehicle({ ...vehicle, featured: e.target.checked })} />
            <label htmlFor="featured" className="text-sm font-medium">Featured on listings</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={vehicle.description || ''} onChange={(e) => setVehicle({ ...vehicle, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input value={vehicle.images[0] || ''} onChange={(e) => setVehicle({ ...vehicle, images: [e.target.value] })} className="w-full px-3 py-2 border rounded-lg" placeholder="/uploads/..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Features</label>
          <div className="flex gap-2 mb-2">
            <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" placeholder="Add feature" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
            <button type="button" onClick={addFeature} className="px-3 py-2 bg-gray-100 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
          <ul className="space-y-1">
            {vehicle.features.map((f, i) => (
              <li key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                {f}
                <button type="button" onClick={() => setVehicle({ ...vehicle, features: vehicle.features.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4 text-red-500" /></button>
              </li>
            ))}
          </ul>
        </div>

        <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save vehicle'}
        </button>
      </div>
    </div>
  )
}
