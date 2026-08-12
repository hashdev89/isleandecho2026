import { tourFitsGuestCountFromTour } from '@/lib/tourGroupSize'

export type ChatAssistMode = 'undecided' | 'bot' | 'live'

export type ChatBookingPath = 'tours' | 'plan-trip'

export type ChatBookingStep =
  | 'choose_mode'
  | 'await_name'
  | 'choose_path'
  | 'travel_type'
  | 'travel_dates'
  | 'guests'
  | 'special_requests'
  | 'recommendations'
  | 'completed'
  | 'live_agent'

export interface ChatBookingIntake {
  step: ChatBookingStep
  mode: ChatAssistMode
  path: ChatBookingPath | null
  travelType: string
  startDate: string
  guests: number
  specialRequests: string
  customerName: string
}

export interface RecommendableTour {
  id: string
  name: string
  duration?: string
  price?: string
  image?: string
  images?: string[]
  rating?: number
  reviews?: number
  style?: string
  description?: string
  destinations?: string[]
  highlights?: string[]
  featured?: boolean
  status?: string
  groupSize?: string
  group_size?: string
}

export const TRAVEL_TYPE_OPTIONS = [
  'Adventure',
  'Beach & Coast',
  'Culture & Heritage',
  'Wildlife Safari',
  'Honeymoon',
  'Family',
  'Mixed / Flexible',
] as const

const TYPE_KEYWORDS: Record<string, string[]> = {
  Adventure: ['adventure', 'hiking', 'trek', 'rafting', 'outdoor', 'climb', 'active'],
  'Beach & Coast': ['beach', 'coast', 'south', 'surf', 'ocean', 'sea', 'galle', 'mirissa', 'unawatuna'],
  'Culture & Heritage': ['culture', 'heritage', 'temple', 'history', 'ancient', 'kandy', 'sigiriya', 'cultural'],
  'Wildlife Safari': ['wildlife', 'safari', 'yala', 'elephant', 'leopard', 'national park', 'wilpattu'],
  Honeymoon: ['honeymoon', 'romantic', 'couple', 'luxury', 'private'],
  Family: ['family', 'kids', 'children', 'gentle', 'easy'],
  'Mixed / Flexible': [],
}

export function createInitialIntake(customerName = ''): ChatBookingIntake {
  return {
    step: 'choose_mode',
    mode: 'undecided',
    path: null,
    travelType: '',
    startDate: '',
    guests: 1,
    specialRequests: '',
    customerName: isGenericCustomerName(customerName) ? '' : customerName,
  }
}

export const MODE_GREETING =
  'Welcome to ISLE & ECHO! How would you like to get help today?\n\n• Chatbot assistant – quick guided help for tours & trip planning\n• Live agent – talk with our team in real time\n\nTap an option below to continue.'

export const LIVE_AGENT_MESSAGE =
  'You are connected for live chat. Our team will reply as soon as possible.\n\nFeel free to type your question here, or continue on WhatsApp. You can switch to the chatbot anytime.'

export function isGenericCustomerName(name?: string | null): boolean {
  if (!name) return true
  const normalized = name.trim().toLowerCase()
  return (
    !normalized ||
    normalized === 'guest' ||
    normalized.startsWith('guest_') ||
    normalized.includes('guest_') ||
    normalized === 'customer'
  )
}

export function scoreTourForTravelType(tour: RecommendableTour, travelType: string): number {
  const haystack = [
    tour.name,
    tour.style,
    tour.description,
    ...(tour.destinations || []),
    ...(tour.highlights || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  let score = 0
  if (tour.featured) score += 2
  if (tour.status === 'active' || !tour.status) score += 1
  if (typeof tour.rating === 'number') score += Math.min(tour.rating, 5) * 0.4

  const keywords = TYPE_KEYWORDS[travelType] || travelType.toLowerCase().split(/\s+/).filter(Boolean)
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 3
  }

  // Soft boost if style/name mentions the travel type label itself
  if (travelType && haystack.includes(travelType.toLowerCase().split(' ')[0])) {
    score += 2
  }

  return score
}

export function recommendTours(
  tours: RecommendableTour[],
  travelType: string,
  limit = 4,
  guestCount?: number
): RecommendableTour[] {
  let active = tours.filter((tour) => !tour.status || tour.status === 'active')
  if (guestCount && guestCount > 0) {
    active = active.filter((tour) => tourFitsGuestCountFromTour(tour, guestCount))
  }
  const ranked = [...active]
    .map((tour) => ({ tour, score: scoreTourForTravelType(tour, travelType) }))
    .sort((a, b) => b.score - a.score || (b.tour.rating || 0) - (a.tour.rating || 0))

  const withSignal = ranked.filter((item) => item.score > 1)
  const pool = withSignal.length >= 2 ? withSignal : ranked
  return pool.slice(0, limit).map((item) => item.tour)
}

export function buildTourBookingUrl(
  tourId: string,
  intake: Pick<ChatBookingIntake, 'startDate' | 'guests' | 'specialRequests' | 'customerName'>
): string {
  const params = new URLSearchParams()
  if (intake.startDate) params.set('startDate', intake.startDate)
  if (intake.guests) params.set('guests', String(intake.guests))
  if (intake.specialRequests) params.set('specialRequests', intake.specialRequests)
  if (intake.customerName) params.set('name', intake.customerName)
  const query = params.toString()
  return `/tours/${tourId}${query ? `?${query}` : ''}`
}

export function buildCustomTripPayload(intake: ChatBookingIntake) {
  return {
    destinations: [] as string[],
    dateRange: intake.startDate || '',
    guests: intake.guests || 1,
    interests: intake.travelType ? [intake.travelType.toLowerCase().replace(/\s+/g, '-')] : [],
    specialRequests: intake.specialRequests || '',
    customerName: intake.customerName || '',
    travelType: intake.travelType || '',
    fromChat: true,
  }
}

export function parseLikelyDate(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed)
    if (!Number.isNaN(d.getTime())) return trimmed
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const slash = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2])
    const year = Number(slash[3])
    const d = new Date(year, month - 1, day)
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10)
    }
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return null
}

export function parseGuestCount(input: string): number | null {
  const match = input.match(/(\d{1,3})/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.min(999, n)
}

export function intakeStorageKey(conversationId: string) {
  return `isle-chat-booking:${conversationId}`
}
