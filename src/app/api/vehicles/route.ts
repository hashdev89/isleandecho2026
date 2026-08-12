import { NextRequest, NextResponse } from 'next/server'
import { loadVehicles, saveVehicles, invalidateVehiclesCache } from '@/lib/vehiclesData'
import type { Vehicle } from '@/lib/vehicleTypes'

export async function GET(request: NextRequest) {
  try {
    const includeAll = request.nextUrl.searchParams.get('all') === 'true'
    const vehicles = loadVehicles().filter((v) => includeAll || v.status === 'active' || !v.status)
    return NextResponse.json({
      success: true,
      data: vehicles,
      message: 'Vehicles retrieved successfully',
    })
  } catch (error) {
    console.error('GET /api/vehicles error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load vehicles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Vehicle>
    if (!body.name || !body.basePricePerDay) {
      return NextResponse.json(
        { success: false, message: 'Name and base price per day are required' },
        { status: 400 }
      )
    }

    const id =
      body.id ||
      body.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

    const vehicles = loadVehicles()
    if (vehicles.some((v) => v.id === id)) {
      return NextResponse.json({ success: false, message: 'Vehicle ID already exists' }, { status: 409 })
    }

    const newVehicle: Vehicle = {
      id,
      name: body.name,
      category: body.category || 'economy',
      basePricePerDay: Number(body.basePricePerDay),
      includedKmPerDay: Number(body.includedKmPerDay ?? 100),
      extraKmRate: Number(body.extraKmRate ?? 50),
      oneWayDropoffFee: body.oneWayDropoffFee != null ? Number(body.oneWayDropoffFee) : undefined,
      seats: Number(body.seats ?? 5),
      transmission: body.transmission || 'Automatic',
      fuelType: body.fuelType || 'Petrol',
      features: Array.isArray(body.features) ? body.features : [],
      images: Array.isArray(body.images) ? body.images : ['/placeholder-image.svg'],
      description: body.description || '',
      badge: body.badge || '',
      status: body.status || 'draft',
      featured: body.featured ?? false,
      rating: body.rating ?? 0,
      reviews: body.reviews ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vehicles.push(newVehicle)
    saveVehicles(vehicles)
    invalidateVehiclesCache()

    return NextResponse.json({ success: true, data: newVehicle, message: 'Vehicle created' }, { status: 201 })
  } catch (error) {
    console.error('POST /api/vehicles error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Vehicle> & { id: string }
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Vehicle id is required' }, { status: 400 })
    }

    const vehicles = loadVehicles()
    const index = vehicles.findIndex((v) => v.id === body.id)
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    const updated: Vehicle = {
      ...vehicles[index],
      ...body,
      id: body.id,
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updated
    saveVehicles(vehicles)
    invalidateVehiclesCache()

    return NextResponse.json({ success: true, data: updated, message: 'Vehicle updated' })
  } catch (error) {
    console.error('PUT /api/vehicles error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'Vehicle id is required' }, { status: 400 })
    }

    const vehicles = loadVehicles()
    const next = vehicles.filter((v) => v.id !== id)
    if (next.length === vehicles.length) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    saveVehicles(next)
    invalidateVehiclesCache()
    return NextResponse.json({ success: true, message: 'Vehicle deleted' })
  } catch (error) {
    console.error('DELETE /api/vehicles error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
