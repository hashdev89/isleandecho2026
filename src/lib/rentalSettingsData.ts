import fs from 'fs'
import path from 'path'
import type { RentalSettings } from '@/lib/vehicleTypes'

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

export function loadRentalSettings(): RentalSettings {
  try {
    ensureDataDir()
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULT_RENTAL_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_RENTAL_SETTINGS, null, 2))
    return DEFAULT_RENTAL_SETTINGS
  } catch (error) {
    console.error('Error loading rental settings:', error)
    return DEFAULT_RENTAL_SETTINGS
  }
}

export function saveRentalSettings(settings: RentalSettings) {
  ensureDataDir()
  const payload = { ...settings, updatedAt: new Date().toISOString() }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2))
}
