'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Save, ArrowLeft, Plus, Trash2, Upload } from 'lucide-react'
import type { Vehicle, VehicleCategory, VehicleStatus } from '@/lib/vehicleTypes'
import ImageSelector from '@/components/ImageSelector'

const CATEGORIES: VehicleCategory[] = ['economy', 'compact', 'midsize', 'suv', 'luxury', 'van', 'sports']
const STATUSES: VehicleStatus[] = ['active', 'draft', 'archived']

const emptyVehicle = (): Vehicle => ({
  id: '',
  name: '',
  category: 'economy',
  basePricePerDay: 55,
  includedKmPerDay: 100,
  extraKmRate: 0.35,
  oneWayDropoffFee: 20,
  seats: 5,
  passengers: 4,
  luggage: 2,
  doors: 4,
  airConditioning: true,
  automatic: true,
  transmission: 'Automatic',
  fuelType: 'Petrol',
  features: [],
  images: [],
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
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false)
  const [replaceImageIndex, setReplaceImageIndex] = useState<number | null>(null)

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

  const openImageSelector = (index: number | null = null) => {
    setReplaceImageIndex(index)
    setImageSelectorOpen(true)
  }

  const handleImageSelect = (imageUrl: string) => {
    setVehicle((prev) => {
      const images = [...(prev.images || [])].filter((url) => url && url !== '/placeholder-image.svg')
      if (replaceImageIndex != null && replaceImageIndex >= 0 && replaceImageIndex < images.length) {
        images[replaceImageIndex] = imageUrl
      } else if (!images.includes(imageUrl)) {
        images.push(imageUrl)
      }
      return { ...prev, images }
    })
    setImageSelectorOpen(false)
    setReplaceImageIndex(null)
  }

  const removeImage = (index: number) => {
    setVehicle((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!vehicle.name || !vehicle.basePricePerDay) {
      alert('Name and base price are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...vehicle,
        id: isNew ? vehicle.id || undefined : vehicle.id,
        updatedAt: new Date().toISOString(),
        images:
          vehicle.images?.length && vehicle.images.some((img) => img && img !== '/placeholder-image.svg')
            ? vehicle.images.filter((img) => img && img !== '/placeholder-image.svg')
            : ['/placeholder-image.svg'],
      }
      if (!isNew && !payload.id) {
        throw new Error('Missing vehicle id — reload the page and try again')
      }
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Save failed (${res.status}). The API did not return JSON.`)
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.message || json.error || 'Save failed')
      router.push('/admin/vehicles')
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  const gallery = (vehicle.images || []).filter((img) => img && img !== '/placeholder-image.svg')

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
            <label className="block text-sm font-medium mb-1">Base price per day (USD)</label>
            <input type="number" step="0.01" value={vehicle.basePricePerDay} onChange={(e) => setVehicle({ ...vehicle, basePricePerDay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Included km per day</label>
            <input type="number" value={vehicle.includedKmPerDay} onChange={(e) => setVehicle({ ...vehicle, includedKmPerDay: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Extra km rate (USD/km)</label>
            <input type="number" step="0.01" value={vehicle.extraKmRate} onChange={(e) => setVehicle({ ...vehicle, extraKmRate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">One-way drop-off fee (USD)</label>
            <input type="number" step="0.01" value={vehicle.oneWayDropoffFee ?? 0} onChange={(e) => setVehicle({ ...vehicle, oneWayDropoffFee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passengers</label>
            <input type="number" value={vehicle.passengers ?? vehicle.seats} onChange={(e) => setVehicle({ ...vehicle, passengers: Number(e.target.value), seats: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Luggage</label>
            <input type="number" value={vehicle.luggage ?? 0} onChange={(e) => setVehicle({ ...vehicle, luggage: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Doors</label>
            <input type="number" value={vehicle.doors ?? 4} onChange={(e) => setVehicle({ ...vehicle, doors: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={vehicle.status} onChange={(e) => setVehicle({ ...vehicle, status: e.target.value as VehicleStatus })} className="w-full px-3 py-2 border rounded-lg">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transmission</label>
            <input value={vehicle.transmission} onChange={(e) => setVehicle({ ...vehicle, transmission: e.target.value, automatic: /auto/i.test(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fuel type</label>
            <input value={vehicle.fuelType} onChange={(e) => setVehicle({ ...vehicle, fuelType: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="ac" checked={vehicle.airConditioning !== false} onChange={(e) => setVehicle({ ...vehicle, airConditioning: e.target.checked })} />
            <label htmlFor="ac" className="text-sm font-medium">Air conditioning</label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="automatic" checked={vehicle.automatic !== false} onChange={(e) => setVehicle({ ...vehicle, automatic: e.target.checked, transmission: e.target.checked ? 'Automatic' : 'Manual' })} />
            <label htmlFor="automatic" className="text-sm font-medium">Automatic</label>
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-medium text-gray-900">Vehicle images</h2>
              <p className="text-xs text-gray-500 mt-0.5">Upload new photos or select from the media library. First image is the cover.</p>
            </div>
            <button
              type="button"
              onClick={() => openImageSelector(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              Upload or select image
            </button>
          </div>

          {gallery.length === 0 ? (
            <button
              type="button"
              onClick={() => openImageSelector(null)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Add vehicle photos</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image
                    src={image}
                    alt={`Vehicle image ${index + 1}`}
                    width={320}
                    height={180}
                    className="w-full h-36 object-cover"
                    unoptimized={image.startsWith('/uploads') || image.startsWith('http')}
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openImageSelector(index)}
                      className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-gray-800"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1.5 rounded-full bg-red-600 text-white"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => openImageSelector(null)}
                className="h-36 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-colors"
              >
                <Plus className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">Add another</span>
              </button>
            </div>
          )}
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

      <ImageSelector
        isOpen={imageSelectorOpen}
        onClose={() => {
          setImageSelectorOpen(false)
          setReplaceImageIndex(null)
        }}
        onSelect={handleImageSelect}
        currentImageUrl={
          replaceImageIndex != null ? gallery[replaceImageIndex] : gallery[0]
        }
        defaultCategory="Transport"
        defaultTab="upload"
      />
    </div>
  )
}
