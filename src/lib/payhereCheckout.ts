import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { generatePayHereHash } from '@/lib/payhere'

export type PayHerePurpose = 'full' | 'deposit'

export function getPaymentBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PAYHERE_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function buildDepositPaymentLink(bookingId: string) {
  return `${getPaymentBaseUrl()}/payments/pay?booking_id=${encodeURIComponent(bookingId)}&purpose=deposit`
}

export function resolveBookingIdFromOrderId(orderId: string) {
  return String(orderId || '').replace(/-DEP$/i, '').replace(/-DEPOSIT$/i, '')
}

export function buildPayHereOrderId(bookingId: string, purpose: PayHerePurpose = 'full') {
  return purpose === 'deposit' ? `${bookingId}-DEP` : bookingId
}

export async function getPayHereCredentials() {
  let merchantId = process.env.PAYHERE_MERCHANT_ID || ''
  let merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || ''
  let baseUrl = getPaymentBaseUrl()
  let isSandbox = process.env.PAYHERE_SANDBOX === 'true'

  if (!merchantId || !merchantSecret) {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: settingsData } = await supabaseAdmin
          .from('settings')
          .select('payhere_merchant_id, payhere_merchant_secret, payhere_sandbox, payhere_base_url')
          .eq('id', 'main')
          .single()

        if (settingsData) {
          merchantId = merchantId || settingsData.payhere_merchant_id || ''
          merchantSecret = merchantSecret || settingsData.payhere_merchant_secret || ''
          baseUrl = (settingsData.payhere_base_url || baseUrl).replace(/\/$/, '')
          isSandbox =
            settingsData.payhere_sandbox !== undefined ? settingsData.payhere_sandbox : isSandbox
        }
      }

      const settingsFile = path.join(process.cwd(), 'data', 'settings.json')
      if ((!merchantId || !merchantSecret) && fs.existsSync(settingsFile)) {
        const fileSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
        merchantId = merchantId || fileSettings.payhereMerchantId || ''
        merchantSecret = merchantSecret || fileSettings.payhereMerchantSecret || ''
        baseUrl = (fileSettings.payhereBaseUrl || baseUrl).replace(/\/$/, '')
        isSandbox =
          fileSettings.payhereSandbox !== undefined ? fileSettings.payhereSandbox : isSandbox
      }
    } catch (error) {
      console.error('Error loading PayHere settings:', error)
    }
  }

  return { merchantId, merchantSecret, baseUrl, isSandbox }
}

export async function createPayHereCheckout(options: {
  bookingId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress?: string
  customerCity?: string
  customerCountry?: string
  itemName: string
  purpose?: PayHerePurpose
}) {
  const { merchantId, merchantSecret, baseUrl, isSandbox } = await getPayHereCredentials()
  if (!merchantId || !merchantSecret) {
    throw new Error(
      'PayHere credentials not configured. Please configure them in Settings > Payments or environment variables.'
    )
  }

  const currency = options.currency || 'LKR'
  const purpose = options.purpose || 'full'
  const orderId = buildPayHereOrderId(options.bookingId, purpose)
  const amount = Number(options.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid payment amount')
  }

  const hash = generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret)
  const formData = {
    merchant_id: merchantId,
    return_url: `${baseUrl}/payments/return?booking_id=${encodeURIComponent(options.bookingId)}&purpose=${purpose}`,
    cancel_url: `${baseUrl}/payments/cancel?booking_id=${encodeURIComponent(options.bookingId)}`,
    notify_url: `${baseUrl}/api/payments/notify`,
    order_id: orderId,
    items:
      purpose === 'deposit'
        ? `${options.itemName} (50% confirmation deposit)`
        : options.itemName,
    currency,
    amount: amount.toFixed(2),
    first_name: options.customerName.split(' ')[0] || options.customerName,
    last_name: options.customerName.split(' ').slice(1).join(' ') || '',
    email: options.customerEmail,
    phone: options.customerPhone || '',
    address: options.customerAddress || 'N/A',
    city: options.customerCity || 'N/A',
    country: options.customerCountry || 'Sri Lanka',
    hash,
  }

  return {
    checkoutUrl: isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout',
    formData,
    orderId,
    paymentLink: buildDepositPaymentLink(options.bookingId),
  }
}
