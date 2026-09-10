import { NextRequest, NextResponse } from 'next/server'
import { loadVehicles, saveVehicles } from '@/lib/vehiclesData'
import type { Vehicle } from '@/lib/vehicleTypes'

export async function GET(request: NextRequest) {
  try {
    const includeAll = request.nextUrl.searchParams.get('all') === 'true'
    const vehicles = (await loadVehicles()).filter((v) => includeAll || v.status === 'active' || !v.status)
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

    const vehicles = await loadVehicles()
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
      seats: Number(body.seats ?? body.passengers ?? 5),
      passengers: Number(body.passengers ?? body.seats ?? 5),
      luggage: body.luggage != null ? Number(body.luggage) : undefined,
      doors: body.doors != null ? Number(body.doors) : undefined,
      airConditioning: body.airConditioning ?? true,
      automatic: body.automatic ?? /auto/i.test(String(body.transmission || 'Automatic')),
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
    await saveVehicles(vehicles)
    // Keep in-memory cache — do not invalidate or a stale remote fetch can wipe the save

    return NextResponse.json({ success: true, data: newVehicle, message: 'Vehicle created' }, { status: 201 })
  } catch (error) {
    console.error('POST /api/vehicles error:', error)
    const detail = error instanceof Error ? error.message : 'Failed to create vehicle'
    return NextResponse.json({ success: false, error: detail, message: detail }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Vehicle> & { id: string }
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Vehicle id is required' }, { status: 400 })
    }

    const vehicles = await loadVehicles()
    const index = vehicles.findIndex((v) => v.id === body.id)
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    const updated: Vehicle = {
      ...vehicles[index],
      ...body,
      id: body.id,
      basePricePerDay:
        body.basePricePerDay != null ? Number(body.basePricePerDay) : vehicles[index].basePricePerDay,
      includedKmPerDay:
        body.includedKmPerDay != null
          ? Number(body.includedKmPerDay)
          : vehicles[index].includedKmPerDay,
      extraKmRate: body.extraKmRate != null ? Number(body.extraKmRate) : vehicles[index].extraKmRate,
      oneWayDropoffFee:
        body.oneWayDropoffFee != null
          ? Number(body.oneWayDropoffFee)
          : vehicles[index].oneWayDropoffFee,
      seats: body.seats != null ? Number(body.seats) : vehicles[index].seats,
      passengers:
        body.passengers != null
          ? Number(body.passengers)
          : body.seats != null
            ? Number(body.seats)
            : vehicles[index].passengers,
      luggage: body.luggage != null ? Number(body.luggage) : vehicles[index].luggage,
      doors: body.doors != null ? Number(body.doors) : vehicles[index].doors,
      features: Array.isArray(body.features) ? body.features : vehicles[index].features,
      images: Array.isArray(body.images) ? body.images : vehicles[index].images,
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updated
    await saveVehicles(vehicles)

    return NextResponse.json({ success: true, data: updated, message: 'Vehicle updated' })
  } catch (error) {
    console.error('PUT /api/vehicles error:', error)
    const detail = error instanceof Error ? error.message : 'Failed to update vehicle'
    return NextResponse.json({ success: false, error: detail, message: detail }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'Vehicle id is required' }, { status: 400 })
    }

    const vehicles = await loadVehicles()
    const next = vehicles.filter((v) => v.id !== id)
    if (next.length === vehicles.length) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    await saveVehicles(next)
    return NextResponse.json({ success: true, message: 'Vehicle deleted' })
  } catch (error) {
    console.error('DELETE /api/vehicles error:', error)
    const detail = error instanceof Error ? error.message : 'Failed to delete vehicle'
    return NextResponse.json({ success: false, error: detail, message: detail }, { status: 500 })
  }
}
