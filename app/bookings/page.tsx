'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { bookings as bookingApi, events, Booking } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import Spinner from '@/app/components/spinner'
import { QRCodeSVG } from 'qrcode.react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChevronDown, ChevronUp, CheckCircle2, Download, X } from 'lucide-react'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#39;'
      default: return character
    }
  })
}

const ticketTypeLabel = (ticketType?: string) => {
  switch (ticketType) {
    case 'vip':
      return 'VIP'
    case 'flash_sale':
      return 'Flash sale'
    default:
      return 'General admission'
  }
}

function BookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const downloadTicket = (booking: Booking) => {
    const qrCode = renderToStaticMarkup(
      <QRCodeSVG value={booking.qr_token} size={220} bgColor="#ffffff" fgColor="#17171d" level="M" />,
    )
    const eventTitle = escapeHtml(booking.event?.title || 'Event')
    const eventDate = escapeHtml(booking.event?.date || 'Date to be announced')
    const eventLocation = escapeHtml(booking.event?.location || 'Venue to be announced')
    const ticketType = escapeHtml(ticketTypeLabel(booking.ticket_type))
    const ticketStatus = escapeHtml(booking.checked_in ? 'Checked in' : booking.status || 'Confirmed')
    const ticketNumber = escapeHtml(
      booking.qr_token.slice(0, 8).toUpperCase() || `GAL-${booking.id}`,
    )
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle} | Galleria Event Pass</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 36px 16px;
      background: #eef0f4;
      color: #17171d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket-shell {
      width: 100%;
      max-width: 460px;
      margin: 0 auto;
      overflow: hidden;
      padding: 10px;
      background: #17171d;
      border: 1px solid #34343b;
      border-radius: 18px;
      box-shadow: 0 15px 40px rgba(23, 23, 29, .18);
    }
    .ticket-heading {
      padding: 10px 12px 3px;
      color: #fff;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1.1px;
      text-align: center;
    }
    .ticket-instruction {
      margin: 0 0 13px;
      padding: 0 12px;
      color: #c9c9d0;
      font-size: 10px;
      text-align: center;
    }
    .ticket-card { overflow: hidden; background: #fff; border-radius: 11px; }
    .ticket-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 17px 19px 0;
    }
    .brand { color: #27263d; font-size: 13px; font-weight: 800; letter-spacing: 1.8px; }
    .ticket-reference { color: #777782; font-size: 9px; font-weight: 700; letter-spacing: .5px; }
    .ticket-event {
      padding: 14px 19px 0;
      color: #17171d;
      font-size: 20px;
      font-weight: 750;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .qr-code { width: fit-content; margin: 18px auto 10px; padding: 7px; background: #fff; }
    .qr-code svg { display: block; width: 200px; height: 200px; }
    .scan-hint { padding: 0 20px 17px; color: #777782; font-size: 10px; text-align: center; }
    .perforation {
      position: relative;
      height: 1px;
      margin: 0 12px;
      border-top: 1px dashed #b6b6bf;
    }
    .perforation::before, .perforation::after {
      position: absolute;
      top: -9px;
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background: #17171d;
      content: '';
    }
    .perforation::before { left: -21px; }
    .perforation::after { right: -21px; }
    .ticket-details { display: grid; grid-template-columns: 1fr 1fr; gap: 17px 14px; padding: 18px 19px 20px; }
    .detail { min-width: 0; }
    .label {
      margin-bottom: 7px;
      color: #777689;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .value {
      color: #25243a;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border: 1px solid #dcd9f1;
      border-radius: 4px;
      background: #f3f1fc;
      color: #3730a9;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .3px;
    }
    .ticket-footer {
      padding: 14px 18px 9px;
      color: #d0cfd6;
      font-size: 10px;
      line-height: 1.6;
      text-align: center;
    }
    .print-button {
      display: block;
      margin: 20px auto 0;
      padding: 10px 17px;
      border: 1px solid #d8d6e5;
      border-radius: 5px;
      background: #fff;
      color: #27263d;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
    }
    @media (max-width: 400px) {
      body { padding: 18px 9px; }
      .ticket-event { font-size: 18px; }
      .qr-code svg { width: 184px; height: 184px; }
      .ticket-details { gap: 14px 10px; padding-right: 15px; padding-left: 15px; }
    }
    @page { margin: 14mm; }
    @media print {
      body { padding: 0; background: #fff; }
      .ticket-shell { max-width: 440px; border-radius: 10px; box-shadow: none; }
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket-shell">
    <div class="ticket-heading">THIS IS YOUR TICKET</div>
    <p class="ticket-instruction">Show this QR code at the entrance for check-in.</p>
    <div class="ticket-card">
      <div class="ticket-brand-row">
        <div class="brand">GALLERIA</div>
        <div class="ticket-reference">TICKET ${ticketNumber}</div>
      </div>
      <div class="ticket-event">${eventTitle}</div>
      <div class="qr-code" aria-label="Ticket check-in QR code">${qrCode}</div>
      <div class="scan-hint">Keep your ticket ready on arrival</div>
      <div class="perforation"></div>
      <div class="ticket-details">
        <div class="detail">
          <div class="label">Date</div>
          <div class="value">${eventDate}</div>
        </div>
        <div class="detail">
          <div class="label">Venue</div>
          <div class="value">${eventLocation}</div>
        </div>
        <div class="detail">
          <div class="label">Ticket type</div>
          <div class="value">${ticketType}</div>
        </div>
        <div class="detail">
          <div class="label">Booking status</div>
          <div class="value"><span class="status">${ticketStatus}</span></div>
        </div>
      </div>
    </div>
    <div class="ticket-footer">GALLERIA &middot; Your pass to events worth showing up for.</div>
  </div>
  <button class="print-button" type="button" onclick="window.print()">Print ticket</button>
</body>
</html>
    `.trim()

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `galleria-ticket-${booking.id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await bookingApi.cancel(bookingId)
      setBookings(bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel')
    }
  }

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    events.getMyBookings()
      .then((res) => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading bookings..." />

  return (
    <main className="max-w-2xl flex flex-col gap-4">
      {success === 'booked' && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          Payment confirmed. Your booking is now active.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
          Payment issue: {error.replace(/_/g, ' ')}. Contact support if charged.
        </div>
      )}
      {bookings.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
          No bookings yet.{' '}
          <Link href="/events" className="underline text-[#3730A9]">Browse events</Link>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="border border-[#E4E1D8] bg-white">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF9F6] transition-colors"
              onClick={() => setExpanded(expanded === booking.id ? null : booking.id)}
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">
                  {booking.event?.title || 'Event'}
                </p>
                <p className="text-xs text-gray-400">
                  {booking.event?.date} · {booking.event?.location}
                </p>
                <p className="text-xs text-gray-500">
                  {ticketTypeLabel(booking.ticket_type)}
                  {booking.notify_event_updates ? ' · Event update emails on' : ''}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 ${
                    booking.checked_in
                      ? 'bg-green-50 text-green-700'
                      : 'bg-[#EEEDFB] text-[#3730A9]'
                  }`}>
                    {booking.checked_in ? '✓ Checked in' : booking.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {booking.event_id ? (
                  <Link
                    href={`/events/${booking.event_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] transition-colors"
                  >
                    View
                  </Link>
                ) : null}
                <button
                  onClick={(e) => { e.stopPropagation(); downloadTicket(booking) }}
                  className="text-xs border border-[#E4E1D8] p-1.5 hover:bg-[#FAF9F6] transition-colors"
                  title="Download ticket"
                >
                  <Download size={13} />
                </button>
                {booking.status === 'confirmed' && !booking.checked_in && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(booking.id) }}
                    className="text-xs border border-[#E4E1D8] p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                    title="Cancel booking"
                  >
                    <X size={13} />
                  </button>
                )}
                {expanded === booking.id
                  ? <ChevronUp size={16} className="text-gray-400" />
                  : <ChevronDown size={16} className="text-gray-400" />
                }
              </div>
            </div>

            {/* QR code — expands on tap */}
            {expanded === booking.id && (
              <div className="border-t border-[#E4E1D8] p-6 flex flex-col items-center gap-4">
                {booking.checked_in ? (
                  <div className="flex flex-col items-center gap-2 text-green-600">
                    <CheckCircle2 size={40} />
                    <p className="text-sm font-medium">Already checked in</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 border border-[#E4E1D8] bg-white">
                      <QRCodeSVG
                        value={booking.qr_token}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#14131F"
                        level="M"
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Show this QR code at the door to check in
                    </p>
                    <p className="text-[10px] font-mono text-gray-300 tracking-widest">
                      {booking.qr_token.slice(0, 8).toUpperCase()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </main>
  )
}

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  )
}