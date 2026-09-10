import fs from 'fs'
import path from 'path'
import type { RentalSettings } from '@/lib/vehicleTypes'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'rental-settings.json')

export const DEFAULT_RENTAL_SETTINGS: RentalSettings = {
  currency: 'USD',
  defaultIncludedKmPerDay: 100,
  defaultExtraKmRate: 0.35,
  defaultOneWayFee: 25,
  dropoffUnitRatePerKm: 0.45,
  roadDistanceMultiplier: 1.25,
  additionalCharges: [
    {
      id: 'child-seat',
      label: 'Child seat',
      amount: 5,
      type: 'per_day',
      enabled: true,
    },
    {
      id: 'extra-stop',
      label: 'Extra stop',
      amount: 10,
      type: 'flat',
      enabled: true,
    },
  ],
}

const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function readLocalSettings(): RentalSettings | null {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return null
    return {
      ...DEFAULT_RENTAL_SETTINGS,
      ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')),
    } as RentalSettings
  } catch {
    return null
  }
}

function stamp(settings: RentalSettings | null | undefined): number {
  if (!settings?.updatedAt) return 0
  const t = Date.parse(settings.updatedAt)
  return Number.isFinite(t) ? t : 0
}

function normalize(settings: RentalSettings): RentalSettings {
  return {
    ...DEFAULT_RENTAL_SETTINGS,
    ...settings,
    dropoffUnitRatePerKm:
      settings.dropoffUnitRatePerKm ?? DEFAULT_RENTAL_SETTINGS.dropoffUnitRatePerKm,
    currency: (settings.currency || 'USD').toUpperCase(),
  }
}

export async function loadRentalSettings(): Promise<RentalSettings> {
  try {
    const local = readLocalSettings()
    const remote = await loadAppJson<RentalSettings>('rental-settings.json')
    const remoteNorm =
      remote && typeof remote === 'object' ? normalize(remote as RentalSettings) : null

    let chosen: RentalSettings
    if (local && remoteNorm) {
      chosen = stamp(local) >= stamp(remoteNorm) ? normalize(local) : remoteNorm
    } else if (local) {
      chosen = normalize(local)
    } else if (remoteNorm) {
      chosen = remoteNorm
    } else {
      chosen = { ...DEFAULT_RENTAL_SETTINGS }
    }

    ensureDataDir()
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(chosen, null, 2))

    if (!remoteNorm || stamp(chosen) > stamp(remoteNorm)) {
      void saveAppJson('rental-settings.json', chosen)
    }

    return chosen
  } catch (error) {
    console.error('Error loading rental settings:', error)
    return readLocalSettings() || { ...DEFAULT_RENTAL_SETTINGS }
  }
}

export async function saveRentalSettings(settings: RentalSettings) {
  ensureDataDir()
  const payload = normalize({
    ...settings,
    updatedAt: new Date().toISOString(),
  })
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2))
  const remoteOk = await saveAppJson('rental-settings.json', payload)
  if (!remoteOk) {
    console.warn('Rental settings saved locally; Supabase sync unavailable or failed')
  }
  return payload
}
