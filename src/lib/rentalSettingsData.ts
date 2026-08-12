import fs from 'fs'
import path from 'path'
import type { RentalSettings } from '@/lib/vehicleTypes'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'rental-settings.json')

export const DEFAULT_RENTAL_SETTINGS: RentalSettings = {
  currency: 'LKR',
  defaultIncludedKmPerDay: 100,
  defaultExtraKmRate: 50,
  defaultOneWayFee: 3000,
  roadDistanceMultiplier: 1.25,
  additionalCharges: [
    {
      id: 'full-insurance',
      label: 'Full insurance cover',
      amount: 1500,
      type: 'per_day',
      enabled: true,
    },
    {
      id: 'driver',
      label: 'Professional driver',
      amount: 5000,
      type: 'per_day',
      enabled: true,
    },
    {
      id: 'airport-pickup',
      label: 'Airport pickup fee',
      amount: 2000,
      type: 'flat',
      enabled: true,
    },
    {
      id: 'child-seat',
      label: 'Child seat',
      amount: 800,
      type: 'per_day',
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

export async function loadRentalSettings(): Promise<RentalSettings> {
  try {
    const remote = await loadAppJson<RentalSettings>('rental-settings.json')
    if (remote && typeof remote === 'object') {
      const merged = { ...DEFAULT_RENTAL_SETTINGS, ...remote }
      try {
        ensureDataDir()
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2))
      } catch {
        /* local cache is optional */
      }
      return merged
    }

    ensureDataDir()
    if (fs.existsSync(SETTINGS_FILE)) {
      const local = { ...DEFAULT_RENTAL_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }
      await saveAppJson('rental-settings.json', local)
      return local
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_RENTAL_SETTINGS, null, 2))
    await saveAppJson('rental-settings.json', DEFAULT_RENTAL_SETTINGS)
    return DEFAULT_RENTAL_SETTINGS
  } catch (error) {
    console.error('Error loading rental settings:', error)
    return DEFAULT_RENTAL_SETTINGS
  }
}

export async function saveRentalSettings(settings: RentalSettings) {
  ensureDataDir()
  const payload = { ...settings, updatedAt: new Date().toISOString() }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2))
  await saveAppJson('rental-settings.json', payload)
}
