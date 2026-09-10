/** Shared Sri Lanka locations for Rent a Car pickup / drop-off */

export interface RentalLocation {
  id: string
  name: string
  lat: number
  lng: number
  region: string
}

/** Alias kept for existing imports */
export type RentalPickupLocation = RentalLocation

function city(
  id: string,
  name: string,
  lat: number,
  lng: number,
  region: string
): RentalLocation {
  return { id, name, lat, lng, region }
}

/**
 * Standard Sri Lanka city / town list for chauffeur rentals.
 * Includes major cities, popular tourist towns, and Katunayake Airport (BIA).
 */
export const SRI_LANKA_CITIES: RentalLocation[] = [
  city('katunayake-airport-bia', 'Katunayake Airport (BIA)', 7.180756, 79.884117, 'Western'),
  city('colombo', 'Colombo', 6.9271, 79.8612, 'Western'),
  city('sri-jayawardenepura-kotte', 'Sri Jayawardenepura Kotte', 6.9000, 79.9167, 'Western'),
  city('dehiwala-mount-lavinia', 'Dehiwala-Mount Lavinia', 6.8294, 79.8650, 'Western'),
  city('moratuwa', 'Moratuwa', 6.7730, 79.8816, 'Western'),
  city('negombo', 'Negombo', 7.2083, 79.8358, 'Western'),
  city('gampaha', 'Gampaha', 7.0917, 79.9942, 'Western'),
  city('kalutara', 'Kalutara', 6.5854, 79.9607, 'Western'),
  city('panadura', 'Panadura', 6.7132, 79.9026, 'Western'),
  city('wattala', 'Wattala', 6.9890, 79.8913, 'Western'),
  city('ja-ela', 'Ja-Ela', 7.0742, 79.8919, 'Western'),
  city('kelaniya', 'Kelaniya', 6.9553, 79.9220, 'Western'),
  city('homagama', 'Homagama', 6.8440, 80.0020, 'Western'),
  city('avissawella', 'Avissawella', 6.9531, 80.2116, 'Western'),

  city('kandy', 'Kandy', 7.2906, 80.6337, 'Central'),
  city('matale', 'Matale', 7.4675, 80.6234, 'Central'),
  city('nuwara-eliya', 'Nuwara Eliya', 6.9497, 80.7891, 'Central'),
  city('dambulla', 'Dambulla', 7.8742, 80.6511, 'Central'),
  city('sigiriya', 'Sigiriya', 7.9570, 80.7603, 'Central'),
  city('hatton', 'Hatton', 6.8917, 80.5966, 'Central'),
  city('nawalapitiya', 'Nawalapitiya', 7.0444, 80.5303, 'Central'),
  city('gampola', 'Gampola', 7.1647, 80.5767, 'Central'),
  city('peradeniya', 'Peradeniya', 7.2699, 80.5938, 'Central'),

  city('galle', 'Galle', 6.0535, 80.2210, 'Southern'),
  city('matara', 'Matara', 5.9549, 80.5550, 'Southern'),
  city('hambantota', 'Hambantota', 6.1241, 81.1185, 'Southern'),
  city('tangalle', 'Tangalle', 6.0240, 80.7911, 'Southern'),
  city('hambantota-port', 'Hambantota Port', 6.1220, 81.1060, 'Southern'),
  city('bentota', 'Bentota', 6.4259, 79.9951, 'Southern'),
  city('hikkaduwa', 'Hikkaduwa', 6.1395, 80.1005, 'Southern'),
  city('unawatuna', 'Unawatuna', 6.0099, 80.2489, 'Southern'),
  city('mirissa', 'Mirissa', 5.9483, 80.4715, 'Southern'),
  city('weligama', 'Weligama', 5.9739, 80.4297, 'Southern'),
  city('ahangama', 'Ahangama', 5.9730, 80.3620, 'Southern'),
  city('tissamaharama', 'Tissamaharama', 6.2844, 81.2875, 'Southern'),
  city('deniyaya', 'Deniyaya', 6.3425, 80.5597, 'Southern'),

  city('jaffna', 'Jaffna', 9.6615, 80.0255, 'Northern'),
  city('vavuniya', 'Vavuniya', 8.7514, 80.4971, 'Northern'),
  city('mannar', 'Mannar', 8.9810, 79.9044, 'Northern'),
  city('kilinochchi', 'Kilinochchi', 9.3803, 80.3770, 'Northern'),
  city('mullaitivu', 'Mullaitivu', 9.2671, 80.8142, 'Northern'),
  city('point-pedro', 'Point Pedro', 9.8167, 80.2333, 'Northern'),

  city('trincomalee', 'Trincomalee', 8.5874, 81.2152, 'Eastern'),
  city('batticaloa', 'Batticaloa', 7.7102, 81.6924, 'Eastern'),
  city('ampara', 'Ampara', 7.2914, 81.6720, 'Eastern'),
  city('kalmunai', 'Kalmunai', 7.4090, 81.8347, 'Eastern'),
  city('pasikudah', 'Pasikudah', 7.9250, 81.5610, 'Eastern'),
  city('arugam-bay', 'Arugam Bay', 6.8404, 81.8360, 'Eastern'),
  city('pottuvil', 'Pottuvil', 6.8750, 81.8333, 'Eastern'),

  city('anuradhapura', 'Anuradhapura', 8.3114, 80.4037, 'North Central'),
  city('polonnaruwa', 'Polonnaruwa', 7.9403, 81.0188, 'North Central'),
  city('habarana', 'Habarana', 8.0390, 80.7510, 'North Central'),
  city('mihintale', 'Mihintale', 8.3500, 80.5000, 'North Central'),

  city('kurunegala', 'Kurunegala', 7.4863, 80.3623, 'North Western'),
  city('puttalam', 'Puttalam', 8.0362, 79.8283, 'North Western'),
  city('chilaw', 'Chilaw', 7.5758, 79.7953, 'North Western'),
  city('kuliyapitiya', 'Kuliyapitiya', 7.4686, 80.0400, 'North Western'),
  city('waikkal', 'Waikkal', 7.2833, 79.8500, 'North Western'),

  city('ratnapura', 'Ratnapura', 6.6828, 80.4012, 'Sabaragamuwa'),
  city('kegalle', 'Kegalle', 7.2513, 80.3464, 'Sabaragamuwa'),
  city('balangoda', 'Balangoda', 6.6600, 80.6700, 'Sabaragamuwa'),
  city('embilipitiya', 'Embilipitiya', 6.3430, 80.8480, 'Sabaragamuwa'),
  city('kitulgala', 'Kitulgala', 6.9890, 80.4110, 'Sabaragamuwa'),

  city('badulla', 'Badulla', 6.9934, 81.0550, 'Uva'),
  city('bandarawela', 'Bandarawela', 6.8290, 80.9880, 'Uva'),
  city('ella', 'Ella', 6.8667, 81.0466, 'Uva'),
  city('haputale', 'Haputale', 6.7650, 80.9580, 'Uva'),
  city('monaragala', 'Monaragala', 6.8728, 81.3500, 'Uva'),
  city('wellawaya', 'Wellawaya', 6.7330, 81.1030, 'Uva'),
  city('udawalawe', 'Udawalawe', 6.4389, 80.8886, 'Uva'),

  city('yala', 'Yala', 6.3724, 81.5185, 'Southern'),
  city('wilpattu', 'Wilpattu', 8.4560, 80.0500, 'North Western'),
]

/** Pickup uses the full city list (airport first). */
export const RENTAL_PICKUP_LOCATIONS: RentalLocation[] = SRI_LANKA_CITIES

/** Drop-off uses the same standard city list. */
export const RENTAL_DROPOFF_LOCATIONS: RentalLocation[] = SRI_LANKA_CITIES

export type RentalTripType = 'multi_day' | 'dropoff'

export const RENTAL_TRIP_TYPES: {
  id: RentalTripType
  title: string
  description: string
}[] = [
  {
    id: 'multi_day',
    title: 'Multi-day Tour (with driver)',
    description: 'Chauffeur-driven tour across several days with pickup and return timing.',
  },
  {
    id: 'dropoff',
    title: 'Drop off (with driver)',
    description: 'One-way transfer to any city in Sri Lanka with a professional driver.',
  },
]

export const RENTAL_WITH_DRIVER_NOTICE =
  'We provide vehicles with a professional driver only. Self-drive rentals are not available.'

export function findRentalLocation(id: string): RentalLocation | undefined {
  return SRI_LANKA_CITIES.find((p) => p.id === id)
}

/** @deprecated use findRentalLocation */
export function findRentalPickup(id: string): RentalLocation | undefined {
  return findRentalLocation(id)
}

export function filterSriLankaCities(query: string, limit = 12): RentalLocation[] {
  const q = query.trim().toLowerCase()
  if (!q) return SRI_LANKA_CITIES.slice(0, limit)
  return SRI_LANKA_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.id.includes(q.replace(/\s+/g, '-'))
  ).slice(0, limit)
}

export function rentalDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}
