export interface GroupSizeRange {
  min: number
  max: number
}

/** Parse backend group size strings like "2 pax", "2-8 pax", "2 to 8 Pax", "Any". */
export function parseGroupSize(raw?: string | null): GroupSizeRange | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (!normalized || normalized === 'any' || normalized === 'n/a' || normalized === '-') {
    return null
  }

  const cleaned = normalized
    .replace(/\b(pax|persons?|people|guests?|travellers?|travelers?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const rangeMatch = cleaned.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      return { min, max }
    }
  }

  const singleMatch = cleaned.match(/(\d+)/)
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10)
    if (Number.isFinite(n) && n > 0) {
      // Single value (e.g. "2 pax") — treat as minimum group size, no upper cap
      return { min: n, max: 999 }
    }
  }

  return null
}

export function getTourGroupSize(tour: {
  groupSize?: string | null
  group_size?: string | null
  importantInfo?: { groupSize?: string } | null
  important_info?: { groupSize?: string } | null
}): string {
  const info = (tour.importantInfo || tour.important_info) as { groupSize?: string } | undefined
  return String(tour.groupSize ?? tour.group_size ?? info?.groupSize ?? '').trim()
}

export function tourFitsGuestCount(
  groupSize: string | undefined | null,
  guestCount: number
): boolean {
  if (!guestCount || guestCount < 1) return true
  const range = parseGroupSize(groupSize)
  if (!range) return true
  return guestCount >= range.min && guestCount <= range.max
}

export function tourFitsGuestCountFromTour(
  tour: Parameters<typeof getTourGroupSize>[0],
  guestCount: number
): boolean {
  return tourFitsGuestCount(getTourGroupSize(tour), guestCount)
}

export function formatGroupSizeRange(groupSize: string | undefined | null): string | null {
  const range = parseGroupSize(groupSize)
  if (!range) return null
  if (range.max >= 999) return `${range.min}+ pax`
  if (range.min === range.max) return `${range.min} pax`
  return `${range.min}–${range.max} pax`
}
