export function normalizeRegion(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function isPublicDestination(dest?: { status?: string | null } | null) {
  const status = String(dest?.status || 'active').toLowerCase()
  return status === 'active' || status === 'published' || status === 'true' || status === ''
}

const REGION_ALIASES: Record<string, string[]> = {
  'southern coast': ['southern coast', 'southern province', 'beach', 'beach destinations'],
  beach: ['beach', 'southern coast', 'southern province', 'beach destinations'],
  'beach destinations': ['beach', 'southern coast', 'southern province'],
  wildlife: ['wildlife', 'wildlife & nature', 'nature'],
  'wildlife & nature': ['wildlife', 'nature'],
  northern: ['northern', 'northern province', 'northern region'],
  'northern region': ['northern', 'northern province'],
  'northern province': ['northern', 'northern province', 'northern region'],
  'hill country': ['hill country', 'central province', 'uva province'],
  'cultural triangle': ['cultural triangle', 'north central province'],
  'western province': ['western province', 'colombo'],
}

export function regionMatches(destRegion: string | undefined | null, selected: string) {
  if (!selected || selected === 'all') return true
  const region = normalizeRegion(destRegion)
  const sel = normalizeRegion(selected)
  if (!region) return false
  if (region === sel) return true
  if (region.includes(sel) || sel.includes(region)) return true
  const aliases = REGION_ALIASES[sel] || []
  return aliases.some((alias) => region === alias || region.includes(alias))
}

export function destinationSearchMatches(
  dest: { name?: string; description?: string; region?: string },
  query: string
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    String(dest.name || '').toLowerCase().includes(q) ||
    String(dest.description || '').toLowerCase().includes(q) ||
    String(dest.region || '').toLowerCase().includes(q)
  )
}

export function uniqueRegions(destinations: Array<{ region?: string | null }>) {
  const seen = new Map<string, string>()
  for (const dest of destinations) {
    const label = String(dest.region || '').trim()
    const key = normalizeRegion(label)
    if (!key || seen.has(key)) continue
    seen.set(key, label)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}
