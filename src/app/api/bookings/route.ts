import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'
import { notifyBookingCreated, type BookingForEmail } from '@/lib/emailService'

// Persistent file-based storage for fallback
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'bookings.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

interface Booking {
  id: string
  booking_ref?: string
  booking_type?: 'tour' | 'vehicle_rental' | 'custom_trip'
  tour_package_id: string
  tour_package_name: string
  vehicle_id?: string
  vehicle_name?: string
  pickup_city_id?: string
  pickup_city_name?: string
  dropoff_city_id?: string
  dropoff_city_name?: string
  route_km?: number
  base_rent?: number
  extra_km_charge?: number
  one_way_fee?: number
  additional_charges?: { label: string; amount: number }[]
  customer_name: string
  customer_email: string
  customer_phone: string
  start_date: string
  end_date: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  special_requests: string
  created_at: string
  payment_status: 'pending' | 'paid' | 'refunded'
}

// Load bookings from file
const loadFallbackBookings = (): Booking[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading fallback bookings:', error)
  }
  return []
}

// Save bookings to file
const saveFallbackBookings = (bookings: Booking[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(bookings, null, 2))
    console.log('Bookings saved to fallback file:', FALLBACK_FILE)
  } catch (error) {
    console.error('Error saving fallback bookings:', error)
  }
}

const parseOrderNumber = (value?: string) => {
	if (!value) return 0
	const match = String(value).trim().toUpperCase().match(/^B(\d+)$/)
	return match ? parseInt(match[1], 10) || 0 : 0
}

const nextOrderNumber = (bookings: Booking[]) => {
	let max = 0
	for (const booking of bookings) {
		max = Math.max(max, parseOrderNumber(booking.booking_ref), parseOrderNumber(booking.id))
	}
	return `B${String(max + 1).padStart(3, '0')}`
}

const loadAllBookings = async (): Promise<Booking[]> => {
	const fallbackBookings = loadFallbackBookings()
	let supabaseBookings: Booking[] = []
	if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
		const { data, error } = await supabaseAdmin.from('bookings').select('*')
		if (error) {
			console.error('Supabase error loading bookings:', error)
		} else {
			supabaseBookings = (data || []) as Booking[]
		}
	}
	return mergeBookings(supabaseBookings, fallbackBookings)
}

const mergeBookings = (primary: Booking[], secondary: Booking[]): Booking[] => {
	const map = new Map<string, Booking>()
	const stamp = (booking: Booking) =>
		new Date((booking as Booking & { updated_at?: string }).updated_at || booking.created_at || 0).getTime()

	for (const booking of [...secondary, ...primary]) {
		if (!booking?.id) continue
		const existing = map.get(booking.id)
		if (!existing || stamp(booking) >= stamp(existing)) {
			map.set(booking.id, { ...existing, ...booking })
		}
	}

	return Array.from(map.values()).sort((a, b) => stamp(b) - stamp(a))
}

const applyBookingFilters = (
	bookings: Booking[],
	userRole: string,
	userEmail: string,
	typeFilter: string | null
) => {
	let next = bookings
	if (userRole === 'customer' && userEmail) {
		next = next.filter(
			(booking) => booking.customer_email?.toLowerCase() === userEmail.toLowerCase()
		)
	}
	if (typeFilter && typeFilter !== 'all') {
		next = next.filter((booking) => (booking.booking_type || 'tour') === typeFilter)
	}
	return next
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url)
		const typeFilter = url.searchParams.get('type')
		const userEmail = request.headers.get('x-user-email') || ''
		const userRole = request.headers.get('x-user-role') || ''
		
		console.log('GET /api/bookings - User info:', { userEmail, userRole, typeFilter })
		
		const merged = await loadAllBookings()
		const filtered = applyBookingFilters(merged, userRole, userEmail, typeFilter)

		return NextResponse.json({
			success: true,
			data: filtered,
			message: 'Bookings retrieved',
		})
	} catch (error: unknown) {
		console.error('Bookings API error:', error)
		const fallbackBookings = loadFallbackBookings()
		const userEmail = request.headers.get('x-user-email') || ''
		const userRole = request.headers.get('x-user-role') || ''
		const typeFilter = new URL(request.url).searchParams.get('type')
		
		return NextResponse.json({ 
			success: true, 
			data: applyBookingFilters(fallbackBookings, userRole, userEmail, typeFilter),
			message: 'Bookings retrieved from fallback storage due to error' 
		})
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json()
		console.log('POST /api/bookings - Received booking data:', body)
		
		const existingBookings = await loadAllBookings()
		const orderNumber = body.booking_ref || body.id || nextOrderNumber(existingBookings)

		const newBooking = {
			id: orderNumber,
			booking_ref: orderNumber,
			booking_type: body.booking_type || 'tour',
			tour_package_id: body.tour_package_id || body.vehicle_id || '',
			tour_package_name: body.tour_package_name || body.vehicle_name || '',
			vehicle_id: body.vehicle_id,
			vehicle_name: body.vehicle_name,
			pickup_city_id: body.pickup_city_id,
			pickup_city_name: body.pickup_city_name,
			dropoff_city_id: body.dropoff_city_id,
			dropoff_city_name: body.dropoff_city_name,
			route_km: body.route_km,
			base_rent: body.base_rent,
			extra_km_charge: body.extra_km_charge,
			one_way_fee: body.one_way_fee,
			additional_charges: body.additional_charges,
			customer_name: body.customer_name,
			customer_email: body.customer_email,
			customer_phone: body.customer_phone,
			start_date: body.start_date,
			end_date: body.end_date,
			guests: body.guests ?? 1,
			total_price: body.total_price ?? null,
			status: body.status ?? 'pending',
			special_requests: body.special_requests ?? '',
			payment_status: body.payment_status ?? 'pending',
			destinations: body.destinations || [],
			interests: body.interests || [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}
		
		console.log('Prepared booking data:', newBooking)

		const emailPayload = newBooking as BookingForEmail
		const respondCreated = async (data: typeof newBooking, message?: string) => {
			try {
				await notifyBookingCreated(emailPayload)
			} catch (emailError) {
				console.error('Booking created but email failed:', emailError)
			}
			return NextResponse.json({
				success: true,
				data,
				message,
			})
		}
		
		// Check if Supabase is configured
		if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
			console.log('Supabase not configured, using fallback storage for booking')
			const fallbackBookings = loadFallbackBookings()
			fallbackBookings.push(newBooking)
			saveFallbackBookings(fallbackBookings)
			console.log('Booking added to fallback storage:', newBooking)
			console.log('Total fallback bookings after add:', fallbackBookings.length)
			return respondCreated(newBooking, 'Booking created successfully (fallback storage)')
		}
		
		const persistFallback = (booking: typeof newBooking) => {
			const fallbackBookings = loadFallbackBookings()
			const sameRecord = fallbackBookings.findIndex((b) =>
				b.id === booking.id &&
				b.customer_email === booking.customer_email &&
				b.created_at === booking.created_at
			)
			if (sameRecord === -1) {
				const collision = fallbackBookings.some((b) => b.id === booking.id)
				if (collision) {
					const uniqueRef = nextOrderNumber(fallbackBookings.concat(existingBookings))
					booking.id = uniqueRef
					booking.booking_ref = uniqueRef
				}
				fallbackBookings.push(booking as Booking)
			} else {
				fallbackBookings[sameRecord] = { ...fallbackBookings[sameRecord], ...booking } as Booking
			}
			saveFallbackBookings(fallbackBookings)
		}

		const supabaseBooking = { ...newBooking } as Record<string, unknown>
		delete supabaseBooking.destinations
		delete supabaseBooking.interests
		for (const key of Object.keys(supabaseBooking)) {
			if (supabaseBooking[key] === undefined) delete supabaseBooking[key]
		}

		let { data, error } = await supabaseAdmin
			.from('bookings')
			.insert(supabaseBooking)
			.select('*')
			.single()

		if (error && (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique'))) {
			const retryRef = nextOrderNumber((await loadAllBookings()).concat(newBooking as Booking))
			newBooking.id = retryRef
			newBooking.booking_ref = retryRef
			supabaseBooking.id = retryRef
			supabaseBooking.booking_ref = retryRef
			const dupRetry = await supabaseAdmin.from('bookings').insert(supabaseBooking).select('*').single()
			data = dupRetry.data
			error = dupRetry.error
		}

		if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.code === '42703')) {
			console.warn('Supabase rejected extra booking columns, retrying with core fields:', error.message)
			const coreBooking = {
				id: newBooking.id,
				tour_package_id: newBooking.tour_package_id,
				tour_package_name: newBooking.tour_package_name,
				customer_name: newBooking.customer_name,
				customer_email: newBooking.customer_email,
				customer_phone: newBooking.customer_phone,
				start_date: newBooking.start_date,
				end_date: newBooking.end_date,
				guests: newBooking.guests,
				total_price: newBooking.total_price,
				status: newBooking.status,
				special_requests: newBooking.special_requests,
				payment_status: newBooking.payment_status,
				created_at: newBooking.created_at,
				updated_at: newBooking.updated_at,
			}
			const retry = await supabaseAdmin.from('bookings').insert(coreBooking).select('*').single()
			data = retry.data
			error = retry.error
		}
		
		console.log('Supabase booking insert result:', { data, error })
		
		if (error) {
			console.error('Supabase booking error:', error)
			persistFallback(newBooking)
			return respondCreated(newBooking, 'Booking created successfully (fallback storage)')
		}

		persistFallback({ ...newBooking, ...(data || {}) } as typeof newBooking)
		console.log('Booking created successfully in Supabase:', data)
		return respondCreated((data || newBooking) as typeof newBooking)
	} catch (error: unknown) {
		console.error('Create booking error:', error)
		return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
	}
}
