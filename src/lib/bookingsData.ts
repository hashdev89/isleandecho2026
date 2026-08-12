import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'

export const FALLBACK_FILE = path.join(process.cwd(), 'data', 'bookings.json')

export type BookingRecord = {
  id: string
  booking_ref?: string
  booking_type?: 'tour' | 'vehicle_rental' | 'custom_trip'
  tour_package_id?: string
  tour_package_name?: string
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
  total_price: number | null
  status: string
  special_requests?: string
  payment_status?: string
  payment_method?: string
  payment_id?: string
  destinations?: unknown[]
  interests?: unknown[]
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export function hasSupabaseBookings() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

export function loadFallbackBookings(): BookingRecord[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8')) as BookingRecord[]
    }
  } catch (error) {
    console.error('Error loading fallback bookings:', error)
  }
  return []
}

export function saveFallbackBookings(bookings: BookingRecord[]) {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(bookings, null, 2))
  } catch (error) {
    console.error('Error saving fallback bookings:', error)
  }
}

function mergeBookings(primary: BookingRecord[], secondary: BookingRecord[]) {
  const map = new Map<string, BookingRecord>()
  const stamp = (booking: BookingRecord) =>
    new Date(booking.updated_at || booking.created_at || 0).getTime()

  for (const booking of [...secondary, ...primary]) {
    if (!booking?.id) continue
    const existing = map.get(booking.id)
    if (!existing || stamp(booking) >= stamp(existing)) {
      map.set(booking.id, { ...existing, ...booking })
    }
  }

  return Array.from(map.values()).sort((a, b) => stamp(b) - stamp(a))
}

export async function loadAllBookings(): Promise<BookingRecord[]> {
  const fallbackBookings = loadFallbackBookings()
  if (!hasSupabaseBookings()) return fallbackBookings

  const { data, error } = await supabaseAdmin.from('bookings').select('*')
  if (error) {
    console.error('Supabase error loading bookings:', error)
    return fallbackBookings
  }
  // Shared Supabase is the source of truth so local JSON cannot diverge from live.
  return ((data || []) as BookingRecord[]).sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at || 0).getTime() -
      new Date(a.updated_at || a.created_at || 0).getTime()
  )
}

const parseOrderNumber = (value?: string) => {
  if (!value) return 0
  const match = String(value).trim().toUpperCase().match(/^B(\d+)$/)
  return match ? parseInt(match[1], 10) || 0 : 0
}

export function nextOrderNumber(bookings: BookingRecord[]) {
  let max = 0
  for (const booking of bookings) {
    max = Math.max(max, parseOrderNumber(booking.booking_ref), parseOrderNumber(booking.id))
  }
  return `B${String(max + 1).padStart(3, '0')}`
}

function normalizeBookingKey(value: string) {
  return decodeURIComponent(String(value || '').trim())
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isColumnOrSchemaError(error: { code?: string; message?: string }) {
  const msg = error.message || ''
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  )
}

function missingColumnFromError(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/)
  return match?.[1] || null
}

function isInvalidIdError(error: { code?: string; message?: string }) {
  const msg = (error.message || '').toLowerCase()
  return error.code === '22P02' || msg.includes('invalid input syntax for type uuid') || msg.includes('invalid uuid')
}

function stripUndefined(record: Record<string, unknown>) {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) next[key] = value
  }
  return next
}

function coreBookingFields(booking: Record<string, unknown>) {
  return stripUndefined({
    id: booking.id,
    booking_ref: booking.booking_ref,
    tour_package_id: booking.tour_package_id,
    tour_package_name: booking.tour_package_name,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    customer_phone: booking.customer_phone,
    start_date: booking.start_date,
    end_date: booking.end_date,
    guests: booking.guests,
    total_price: booking.total_price,
    status: booking.status,
    special_requests: booking.special_requests,
    payment_status: booking.payment_status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  })
}

async function insertBookingRow(payload: Record<string, unknown>) {
  return supabaseAdmin.from('bookings').insert(payload).select('*').single()
}

async function insertBookingToSupabase(booking: Record<string, unknown>) {
  let payload = stripUndefined({
    ...booking,
    destinations: undefined,
    interests: undefined,
  })

  const maxAttempts = 25
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await insertBookingRow(payload)

    if (!result.error) return result

    if (result.error && isInvalidIdError(result.error) && payload.id && !isUuid(String(payload.id))) {
      const withoutId = { ...payload }
      delete withoutId.id
      payload = withoutId
      continue
    }

    if (result.error && (result.error.code === '23505' || result.error.message?.includes('duplicate'))) {
      const retryRef = nextOrderNumber(await loadAllBookings())
      payload = {
        ...payload,
        id: isUuid(String(payload.id || '')) ? payload.id : retryRef,
        booking_ref: retryRef,
      }
      continue
    }

    const missingCol = missingColumnFromError(result.error.message || '')
    if (missingCol && missingCol in payload) {
      console.warn(`Bookings table missing column "${missingCol}", omitting for this insert`)
      const next = { ...payload }
      delete next[missingCol]
      payload = next
      continue
    }

    if (result.error && isColumnOrSchemaError(result.error)) {
      console.warn('Supabase rejected booking columns, retrying with core fields:', result.error.message)
      payload = coreBookingFields(payload)
      continue
    }

    if (result.error && isInvalidIdError(result.error)) {
      const core = coreBookingFields(payload)
      delete core.id
      payload = core
      continue
    }

    return result
  }

  return insertBookingRow(coreBookingFields(payload))
}

async function querySupabaseBooking(key: string) {
  const { data: byId, error: byIdError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', key)
    .maybeSingle()

  if (byIdError) console.error('Supabase booking lookup by id:', byIdError.message)
  if (byId) return byId as BookingRecord

  const { data: byRef, error: byRefError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('booking_ref', key)
    .maybeSingle()

  if (byRefError) console.error('Supabase booking lookup by booking_ref:', byRefError.message)
  if (byRef) return byRef as BookingRecord

  return null
}

export async function findBookingById(bookingId: string): Promise<BookingRecord | null> {
  const key = normalizeBookingKey(bookingId)
  if (!key) return null

  if (hasSupabaseBookings()) {
    const fromDb = await querySupabaseBooking(key)
    if (fromDb) return fromDb
  }

  const fallback = loadFallbackBookings()
  return (
    fallback.find((booking) => booking.id === key || booking.booking_ref === key) || null
  )
}

function mirrorToFallback(booking: BookingRecord) {
  const fallback = loadFallbackBookings()
  const index = fallback.findIndex(
    (item) =>
      item.id === booking.id ||
      (!!booking.booking_ref && item.booking_ref === booking.booking_ref)
  )
  if (index === -1) fallback.push(booking)
  else fallback[index] = { ...fallback[index], ...booking }
  saveFallbackBookings(fallback)
}

export async function createBooking(body: Record<string, unknown>): Promise<BookingRecord> {
  const existingBookings = await loadAllBookings()
  const orderNumber = String(body.booking_ref || body.id || nextOrderNumber(existingBookings))

  const newBooking: BookingRecord = {
    id: orderNumber,
    booking_ref: orderNumber,
    booking_type: (body.booking_type as BookingRecord['booking_type']) || 'tour',
    tour_package_id: String(body.tour_package_id || body.vehicle_id || ''),
    tour_package_name: String(body.tour_package_name || body.vehicle_name || ''),
    vehicle_id: body.vehicle_id as string | undefined,
    vehicle_name: body.vehicle_name as string | undefined,
    pickup_city_id: body.pickup_city_id as string | undefined,
    pickup_city_name: body.pickup_city_name as string | undefined,
    dropoff_city_id: body.dropoff_city_id as string | undefined,
    dropoff_city_name: body.dropoff_city_name as string | undefined,
    route_km: body.route_km as number | undefined,
    base_rent: body.base_rent as number | undefined,
    extra_km_charge: body.extra_km_charge as number | undefined,
    one_way_fee: body.one_way_fee as number | undefined,
    additional_charges: body.additional_charges as BookingRecord['additional_charges'],
    customer_name: String(body.customer_name || ''),
    customer_email: String(body.customer_email || ''),
    customer_phone: String(body.customer_phone || ''),
    start_date: String(body.start_date || ''),
    end_date: String(body.end_date || ''),
    guests: Number(body.guests ?? 1),
    total_price: body.total_price == null ? null : Number(body.total_price),
    status: String(body.status || 'pending'),
    special_requests: String(body.special_requests || ''),
    payment_status: String(body.payment_status || 'pending'),
    destinations: (body.destinations as unknown[]) || [],
    interests: (body.interests as unknown[]) || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (!hasSupabaseBookings()) {
    const fallback = loadFallbackBookings()
    fallback.push(newBooking)
    saveFallbackBookings(fallback)
    return newBooking
  }

  const { data, error } = await insertBookingToSupabase(newBooking as unknown as Record<string, unknown>)
  if (error || !data) {
    console.error('Supabase booking insert failed:', error)
    throw new Error(
      error?.message?.includes('schema cache') || error?.code === 'PGRST204'
        ? `${error.message} Run scripts/supabase-bookings-migration.sql in the Supabase SQL Editor, then try again.`
        : error?.message ||
            'Could not save booking to the database. Please check the bookings table in Supabase.'
    )
  }

  const saved = { ...newBooking, ...(data as BookingRecord) } as BookingRecord
  mirrorToFallback(saved)
  return saved
}

export function applyBookingFilters(
  bookings: BookingRecord[],
  userRole: string,
  userEmail: string,
  typeFilter: string | null
) {
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

export async function updateBookingById(
  bookingId: string,
  updates: Record<string, unknown>
): Promise<BookingRecord | null> {
  const existing = await findBookingById(bookingId)
  if (!existing) return null

  const patch = { ...updates, updated_at: new Date().toISOString() }

  if (hasSupabaseBookings()) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (!error && data) {
      const saved = data as BookingRecord
      mirrorToFallback(saved)
      return saved
    }

    if (existing.booking_ref) {
      const retry = await supabaseAdmin
        .from('bookings')
        .update(patch)
        .eq('booking_ref', existing.booking_ref)
        .select('*')
        .single()
      if (!retry.error && retry.data) {
        const saved = retry.data as BookingRecord
        mirrorToFallback(saved)
        return saved
      }
    }

    console.error('Supabase booking update failed:', error?.message)
  }

  const fallback = loadFallbackBookings()
  const index = fallback.findIndex(
    (item) => item.id === existing.id || item.booking_ref === existing.booking_ref
  )
  if (index === -1) return null
  fallback[index] = { ...fallback[index], ...patch }
  saveFallbackBookings(fallback)
  return fallback[index]
}
