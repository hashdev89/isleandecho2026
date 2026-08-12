const BRAND = {
  name: 'Isle & Echo',
  lagoonDeep: '#0b3d4a',
  lagoon: '#0b6e7a',
  sun: '#d4f06a',
  foam: '#f6f3ec',
  ink: '#1a2b2e',
  muted: '#5b6b70',
  white: '#ffffff',
  phone: '+94 741 415 812',
  email: 'info@isleandecho.com',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://isleandecho.com',
}

export type BookingEmailType = 'tour' | 'custom_trip' | 'vehicle_rental'

export interface BookingEmailPayload {
  id: string
  booking_type?: BookingEmailType | string
  tour_package_name?: string
  vehicle_name?: string
  pickup_city_name?: string
  dropoff_city_name?: string
  route_km?: number | null
  customer_name: string
  customer_email: string
  customer_phone?: string
  start_date?: string
  end_date?: string
  guests?: number
  total_price?: number | null
  status?: string
  payment_status?: string
  payment_method?: string | null
  payment_id?: string | null
  special_requests?: string | null
  destinations?: string[]
  interests?: string[]
  created_at?: string
}

export interface ContactEmailPayload {
  name: string
  email: string
  phone?: string
  subject: string
  subjectLabel: string
  message: string
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const display = (value: unknown) => {
  if (value == null || value === '') return '—'
  return escapeHtml(value)
}

export const formatMoney = (amount?: number | null) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `${Number(amount).toLocaleString('en-LK')} LKR`
}

export const formatDateLabel = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const bookingKindLabel = (type?: string) => {
  if (type === 'vehicle_rental') return 'Car rental'
  if (type === 'custom_trip') return 'Custom trip'
  return 'Tour package'
}

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 0;color:${BRAND.muted};font-size:13px;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;color:${BRAND.ink};font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>
`

function layout(options: {
  preheader: string
  eyebrow: string
  title: string
  intro: string
  body: string
  ctaLabel?: string
  ctaHref?: string
}) {
  const cta = options.ctaLabel && options.ctaHref
    ? `<a href="${escapeHtml(options.ctaHref)}" style="display:inline-block;background:${BRAND.sun};color:${BRAND.lagoonDeep};text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:14px;letter-spacing:0.02em;">${escapeHtml(options.ctaLabel)}</a>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.foam};font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.foam};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:${BRAND.lagoonDeep};padding:28px 32px 24px;border-radius:20px 20px 0 0;">
              <p style="margin:0 0 8px;color:${BRAND.sun};font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">${escapeHtml(options.eyebrow)}</p>
              <h1 style="margin:0;color:${BRAND.white};font-size:28px;line-height:1.25;font-weight:700;">${escapeHtml(BRAND.name)}</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.78);font-family:Arial,Helvetica,sans-serif;font-size:13px;">Sri Lanka, beautifully arranged</p>
            </td>
          </tr>
          <tr>
            <td style="height:6px;background:${BRAND.sun};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${BRAND.white};padding:32px;color:${BRAND.ink};">
              <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(options.title)}</h2>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.muted};">${options.intro}</p>
              ${options.body}
              ${cta ? `<div style="margin:28px 0 8px;">${cta}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.lagoonDeep};padding:22px 32px;border-radius:0 0 20px 20px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 6px;color:${BRAND.sun};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">Need a hand?</p>
              <p style="margin:0;color:rgba(255,255,255,0.86);font-size:13px;line-height:1.6;">
                ${escapeHtml(BRAND.phone)} · ${escapeHtml(BRAND.email)}<br />
                55/A, Kulupana, Pokunuwita, Sri Lanka
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function detailsCard(title: string, rows: string) {
  return `
    <div style="border:1px solid #eadfce;border-radius:16px;padding:8px 20px 4px;background:${BRAND.foam};">
      <p style="margin:12px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.lagoon};font-weight:700;">${escapeHtml(title)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </div>
  `
}

function bookingRows(booking: BookingEmailPayload) {
  const kind = booking.booking_type || 'tour'
  const title =
    kind === 'vehicle_rental'
      ? booking.vehicle_name || booking.tour_package_name || 'Vehicle rental'
      : booking.tour_package_name || (kind === 'custom_trip' ? 'Custom Sri Lanka trip' : 'Tour booking')

  const extra =
    kind === 'vehicle_rental'
      ? [
          row('Pickup', display(booking.pickup_city_name)),
          row('Drop-off', display(booking.dropoff_city_name)),
          row('Route', booking.route_km != null ? `${display(booking.route_km)} km` : '—'),
        ].join('')
      : kind === 'custom_trip'
        ? [
            row('Destinations', display((booking.destinations || []).join(', ') || 'To be confirmed')),
            row('Interests', display((booking.interests || []).join(', ') || '—')),
          ].join('')
        : ''

  return {
    title,
    html: [
      detailsCard('Reservation', [
        row('Reference', display(booking.id)),
        row('Type', display(bookingKindLabel(kind))),
        row(kind === 'vehicle_rental' ? 'Vehicle' : 'Package', display(title)),
        row('Status', display(booking.status || 'pending')),
        row('Payment', display(booking.payment_status || 'pending')),
      ].join('')),
      '<div style="height:14px;"></div>',
      detailsCard('Traveller', [
        row('Name', display(booking.customer_name)),
        row('Email', display(booking.customer_email)),
        row('Phone', display(booking.customer_phone)),
      ].join('')),
      '<div style="height:14px;"></div>',
      detailsCard(kind === 'vehicle_rental' ? 'Hire details' : 'Travel details', [
        row(kind === 'vehicle_rental' ? 'Pickup date' : 'Start date', formatDateLabel(booking.start_date)),
        row(kind === 'vehicle_rental' ? 'Return date' : 'End date', formatDateLabel(booking.end_date)),
        ...(kind === 'vehicle_rental' ? [] : [row('Guests', display(booking.guests ?? 1))]),
        extra,
        row('Estimated total', formatMoney(booking.total_price)),
      ].join('')),
      booking.special_requests
        ? `<div style="height:14px;"></div>${detailsCard('Notes', `<tr><td colspan="2" style="padding:8px 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(booking.special_requests)}</td></tr>`)}`
        : '',
    ].join(''),
  }
}

export function bookingReceivedCustomer(booking: BookingEmailPayload) {
  const kind = booking.booking_type || 'tour'
  const { title, html } = bookingRows(booking)
  const copy =
    kind === 'vehicle_rental'
      ? `Thank you, ${escapeHtml(booking.customer_name)}. We have received your car rental request for <strong>${escapeHtml(title)}</strong> and our team will confirm availability shortly.`
      : kind === 'custom_trip'
        ? `Thank you, ${escapeHtml(booking.customer_name)}. Your custom Sri Lanka itinerary request is with our planners. We will be in touch to refine dates, stays, and experiences.`
        : `Thank you, ${escapeHtml(booking.customer_name)}. Your booking request for <strong>${escapeHtml(title)}</strong> is in. We will review availability and send the next steps soon.`

  return {
    subject: `We received your ${bookingKindLabel(kind).toLowerCase()} request · ${booking.id}`,
    text: `Hi ${booking.customer_name}, we received your ${bookingKindLabel(kind).toLowerCase()} request ${booking.id}. Our team will follow up shortly.`,
    html: layout({
      preheader: `Your ${bookingKindLabel(kind).toLowerCase()} request ${booking.id} is with Isle & Echo.`,
      eyebrow: 'Request received',
      title: 'Your request is with us',
      intro: copy,
      body: html,
      ctaLabel: 'Visit Isle & Echo',
      ctaHref: BRAND.siteUrl,
    }),
  }
}

export function bookingReceivedAdmin(booking: BookingEmailPayload) {
  const { title, html } = bookingRows(booking)
  return {
    subject: `New ${bookingKindLabel(booking.booking_type).toLowerCase()} · ${booking.id} · ${booking.customer_name}`,
    text: `New ${bookingKindLabel(booking.booking_type)} request ${booking.id} from ${booking.customer_name} (${booking.customer_email}).`,
    html: layout({
      preheader: `${booking.customer_name} submitted ${title}.`,
      eyebrow: 'New enquiry',
      title: 'A visitor just booked',
      intro: `<strong>${escapeHtml(booking.customer_name)}</strong> submitted a ${escapeHtml(bookingKindLabel(booking.booking_type).toLowerCase())} request. Reply from this email or update the booking in admin.`,
      body: html,
      ctaLabel: 'Open admin bookings',
      ctaHref: `${BRAND.siteUrl}/admin/bookings/${encodeURIComponent(booking.id)}`,
    }),
  }
}

export function bookingUpdateCustomer(booking: BookingEmailPayload, previous?: { status?: string; payment_status?: string }) {
  const status = (booking.status || 'pending').toLowerCase()
  const payment = (booking.payment_status || 'pending').toLowerCase()
  const statusChanged = previous?.status && previous.status !== booking.status
  const paymentChanged = previous?.payment_status && previous.payment_status !== booking.payment_status

  let title = 'An update on your booking'
  let intro = `Hi ${escapeHtml(booking.customer_name)}, there is a new update on booking <strong>${escapeHtml(booking.id)}</strong>.`

  if (statusChanged && status === 'confirmed') {
    title = 'Your booking is confirmed'
    intro = `Wonderful news, ${escapeHtml(booking.customer_name)}. Booking <strong>${escapeHtml(booking.id)}</strong> is confirmed. We look forward to hosting you in Sri Lanka.`
  } else if (statusChanged && status === 'cancelled') {
    title = 'Your booking has been cancelled'
    intro = `Hi ${escapeHtml(booking.customer_name)}, booking <strong>${escapeHtml(booking.id)}</strong> has been cancelled. If this is unexpected, please reply and we will help immediately.`
  } else if (statusChanged && status === 'completed') {
    title = 'Thank you for travelling with us'
    intro = `${escapeHtml(booking.customer_name)}, thank you for choosing Isle & Echo. We hope the journey stays with you — and we would love to plan the next one.`
  } else if (paymentChanged && payment === 'deposit_paid') {
    title = 'Deposit received'
    intro = `Thank you, ${escapeHtml(booking.customer_name)}. We have received your confirmation deposit for booking <strong>${escapeHtml(booking.id)}</strong>. The remaining balance is due before travel.`
  } else if (paymentChanged && payment === 'paid') {
    title = 'Payment received'
    intro = `Thank you, ${escapeHtml(booking.customer_name)}. We have received payment for booking <strong>${escapeHtml(booking.id)}</strong>.`
  } else if (paymentChanged && payment === 'refunded') {
    title = 'Refund processed'
    intro = `Hi ${escapeHtml(booking.customer_name)}, a refund has been processed for booking <strong>${escapeHtml(booking.id)}</strong>. Please allow a few business days for it to appear.`
  }

  const { html } = bookingRows(booking)
  return {
    subject: `${title} · ${booking.id}`,
    text: `${title}. Booking ${booking.id} is now ${booking.status || 'updated'} / payment ${booking.payment_status || 'updated'}.`,
    html: layout({
      preheader: `${title} for ${booking.id}.`,
      eyebrow: 'Booking update',
      title,
      intro,
      body: html,
      ctaLabel: 'Contact Isle & Echo',
      ctaHref: `${BRAND.siteUrl}/contact`,
    }),
  }
}

export function bookingUpdateAdmin(booking: BookingEmailPayload) {
  const { html } = bookingRows(booking)
  return {
    subject: `Booking updated · ${booking.id} · ${booking.status || 'status change'}`,
    text: `Booking ${booking.id} updated. Status: ${booking.status}. Payment: ${booking.payment_status}.`,
    html: layout({
      preheader: `${booking.id} is now ${booking.status || 'updated'}.`,
      eyebrow: 'Admin update',
      title: 'Booking follow-up sent',
      intro: `The guest has been emailed about this change to <strong>${escapeHtml(booking.id)}</strong>.`,
      body: html,
    }),
  }
}

export function invoiceCustomer(customerName: string, bookingId: string) {
  return {
    subject: `Invoice for booking ${bookingId} · Isle & Echo`,
    text: `Thank you for your payment. Invoice for booking ${bookingId} is attached.`,
    html: layout({
      preheader: `Your invoice for ${bookingId} is attached.`,
      eyebrow: 'Payment',
      title: 'Your invoice is ready',
      intro: `Dear ${escapeHtml(customerName)}, thank you for booking with Isle & Echo. Your payment has been received and the invoice for <strong>${escapeHtml(bookingId)}</strong> is attached for your records.`,
      body: `<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.muted};margin:0;">If anything looks incorrect, reply to this email and we will sort it the same day.</p>`,
    }),
  }
}

export function contactAdmin(payload: ContactEmailPayload) {
  const body = detailsCard('Message', [
    row('Name', display(payload.name)),
    row('Email', display(payload.email)),
    row('Phone', display(payload.phone)),
    row('Subject', display(payload.subjectLabel)),
    `<tr><td colspan="2" style="padding:12px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};white-space:pre-wrap;">${escapeHtml(payload.message)}</td></tr>`,
  ].join(''))

  return {
    subject: `Contact form · ${payload.subjectLabel} · ${payload.name}`,
    text: `${payload.name} (${payload.email}) wrote:\n\n${payload.message}`,
    html: layout({
      preheader: `${payload.name} sent a ${payload.subjectLabel.toLowerCase()}.`,
      eyebrow: 'Website enquiry',
      title: 'New contact message',
      intro: `<strong>${escapeHtml(payload.name)}</strong> wrote via the website contact form. You can reply directly to this email.`,
      body,
    }),
  }
}

export function payLaterCustomer(booking: BookingEmailPayload) {
  const { html } = bookingRows(booking)
  return {
    subject: `Pay later confirmed · ${booking.id} · Isle & Echo`,
    text: `Hi ${booking.customer_name}, you chose to pay later for booking ${booking.id}. We will email a 50% confirmation invoice once your tour is confirmed.`,
    html: layout({
      preheader: `You chose to pay later for ${booking.id}.`,
      eyebrow: 'Pay after',
      title: 'You can settle payment after confirmation',
      intro: `Thank you, ${escapeHtml(booking.customer_name)}. Booking <strong>${escapeHtml(booking.id)}</strong> is reserved as <em>pay later</em>. Our team will review it, then send an invoice asking for <strong>50% to confirm</strong>. The remaining 50% is due before travel.`,
      body: html,
      ctaLabel: 'Message Isle & Echo',
      ctaHref: `${BRAND.siteUrl}/contact`,
    }),
  }
}

export function payLaterAdmin(booking: BookingEmailPayload) {
  const { html } = bookingRows(booking)
  return {
    subject: `Pay later selected · ${booking.id} · ${booking.customer_name}`,
    text: `${booking.customer_name} chose pay later for ${booking.id}. Confirm the booking and send the 50% invoice from admin.`,
    html: layout({
      preheader: `${booking.customer_name} will pay after confirmation.`,
      eyebrow: 'Pay later',
      title: 'Customer chose to pay after',
      intro: `<strong>${escapeHtml(booking.customer_name)}</strong> selected <em>Pay after</em> for <strong>${escapeHtml(booking.id)}</strong>. Confirm the tour in admin, then send the 50% confirmation invoice.`,
      body: html,
      ctaLabel: 'Open booking in admin',
      ctaHref: `${BRAND.siteUrl}/admin/bookings/${encodeURIComponent(booking.id)}`,
    }),
  }
}

export function depositInvoiceCustomer(
  booking: BookingEmailPayload,
  amounts: { total: string; deposit: string; balance: string; percent: number },
  paymentLink?: string
) {
  const { html } = bookingRows(booking)
  const payUrl = paymentLink || `${BRAND.siteUrl}/payments/pay?booking_id=${encodeURIComponent(booking.id)}&purpose=deposit`
  const payment = detailsCard('50% confirmation payment', [
    row('Tour total', amounts.total),
    row(`Due now (${amounts.percent}%)`, amounts.deposit),
    row('Balance before travel', amounts.balance),
    `<tr><td colspan="2" style="padding:10px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};">Please pay <strong>${amounts.deposit}</strong> now to confirm booking <strong>${escapeHtml(booking.id)}</strong>. Use the secure PayHere payment link below (cards, bank apps, and wallets). The remaining ${amounts.balance} is due before your start date. A PDF invoice is attached.</td></tr>`,
  ].join(''))

  return {
    subject: `Confirm your booking · pay ${amounts.percent}% · ${booking.id}`,
    text: `Your booking ${booking.id} needs a ${amounts.percent}% payment of ${amounts.deposit}. Pay securely here: ${payUrl}. Balance ${amounts.balance} before travel. Invoice attached.`,
    html: layout({
      preheader: `Pay ${amounts.deposit} (${amounts.percent}%) via PayHere to confirm booking ${booking.id}.`,
      eyebrow: 'Confirmation invoice',
      title: 'Your tour is ready to confirm',
      intro: `Dear ${escapeHtml(booking.customer_name)}, we are delighted to confirm availability for <strong>${escapeHtml(booking.tour_package_name || 'your Isle & Echo journey')}</strong>. To secure it, please pay <strong>${amounts.deposit}</strong> (${amounts.percent}% of ${amounts.total}) using the PayHere link below.`,
      body: `${payment}<div style="height:14px;"></div>${html}`,
      ctaLabel: `Pay ${amounts.percent}% with PayHere`,
      ctaHref: payUrl,
    }),
  }
}

export function contactAutoReply(payload: ContactEmailPayload) {
  return {
    subject: `We received your message · Isle & Echo`,
    text: `Hi ${payload.name}, thank you for writing to Isle & Echo. We have received your message and will reply shortly.`,
    html: layout({
      preheader: 'Thank you for contacting Isle & Echo.',
      eyebrow: 'Message received',
      title: 'Thank you for writing to us',
      intro: `Hi ${escapeHtml(payload.name)}, your message is with our team. We typically reply within one business day — sooner if you are mid-trip and need help.`,
      body: detailsCard('Your message', [
        row('Subject', display(payload.subjectLabel)),
        `<tr><td colspan="2" style="padding:12px 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};white-space:pre-wrap;">${escapeHtml(payload.message)}</td></tr>`,
      ].join('')),
      ctaLabel: 'Explore journeys',
      ctaHref: `${BRAND.siteUrl}/tours`,
    }),
  }
}
