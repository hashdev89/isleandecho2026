'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, RefreshCw, Car } from 'lucide-react'
import { formatRentalCurrency } from '@/lib/rentalPricing'
import type { Vehicle } from '@/lib/vehicleTypes'

export default function VehiclesAdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vehicles?all=true')
      const json = await res.json()
      if (json.success) setVehicles(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const filtered = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    const res = await fetch(`/api/vehicles?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) setVehicles((prev) => prev.filter((v) => v.id !== id))
    else alert(json.message || 'Delete failed')
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-7 h-7" /> Vehicles
          </h1>
          <p className="text-gray-600 mt-1">Manage rent-a-car fleet, rates, and km pricing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/rental-settings" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Rental settings
          </Link>
          <Link href="/admin/vehicles/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add vehicle
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button type="button" onClick={loadVehicles} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" aria-label="Refresh">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Km/day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{vehicle.name}</td>
                <td className="px-6 py-4 text-gray-600 capitalize">{vehicle.category}</td>
                <td className="px-6 py-4 text-gray-600">{formatRentalCurrency(vehicle.basePricePerDay)}</td>
                <td className="px-6 py-4 text-gray-600">{vehicle.includedKmPerDay} km</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Link href={`/admin/vehicles/${vehicle.id}`} className="inline-flex p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button type="button" onClick={() => handleDelete(vehicle.id)} className="inline-flex p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-gray-500">No vehicles found.</p>
        )}
      </div>
    </div>
  )
}
