'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { bookings as bookingApi, events, Booking } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import Spinner from '@/app/components/spinner'
import { QRCodeSVG } from 'qrcode.react'
import { ChevronDown, ChevronUp, CheckCircle2, Download, X } from 'lucide-react'

function BookingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const downloadTicket = (booking: Booking) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Galleria Event Ticket</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .ticket {
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .ticket-header {
      background: linear-gradient(135deg, #3730A9 0%, #5B5AC7 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    
    .ticket-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: 2px;
    }
    
    .ticket-header p {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .ticket-body {
      padding: 30px 20px;
    }
    
    .ticket-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 1px solid #E4E1D8;
      padding-bottom: 20px;
    }
    
    .ticket-row:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .ticket-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    
    .ticket-value {
      font-size: 16px;
      color: #14131F;
      font-weight: 600;
      text-align: right;
      flex: 1;
      margin-left: 15px;
      word-break: break-word;
    }
    
    .event-title {
      font-size: 20px;
      font-weight: 700;
      color: #14131F;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
    }
    
    .status-badge.checked-in {
      background: #D1FAE5;
      color: #065F46;
    }
    
    .status-badge.confirmed {
      background: #EEEDFB;
      color: #3730A9;
    }
    
    .ticket-footer {
      background: #FAF9F6;
      padding: 20px;
      text-align: center;
      border-top: 2px dashed #E4E1D8;
    }
    
    .ticket-footer p {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #E4E1D8, transparent);
      margin: 20px 0;
    }
    
    @media (max-width: 600px) {
      .ticket {
        max-width: 100%;
      }
      
      .ticket-header h1 {
        font-size: 24px;
      }
      
      .ticket-value {
        font-size: 14px;
      }
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .ticket {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <h1>GALLERIA</h1>
      <p>Event Ticket</p>
    </div>
    
    <div class="ticket-body">
      <div class="ticket-row">
        <div>
          <div class="ticket-label">Event</div>
          <div class="ticket-value event-title">${booking.event?.title || 'Event'}</div>
        </div>
      </div>
      
      <div class="ticket-row">
        <div>
          <div class="ticket-label">Date & Location</div>
          <div class="ticket-value">${booking.event?.date} · ${booking.event?.location}</div>
        </div>
      </div>
      
      <div class="ticket-row">
        <div>
          <div class="ticket-label">Booking Status</div>
          <div>
            <div class="ticket-value">${booking.status}</div>
            <span class="status-badge ${booking.checked_in ? 'checked-in' : 'confirmed'}">
              ${booking.checked_in ? '✓ Checked In' : 'Confirmed'}
            </span>
          </div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="ticket-row">
        <div>
          <div class="ticket-label">Ticket Token</div>
          <div class="ticket-value" style="font-family: 'Monaco', 'Courier New', monospace; font-size: 14px; letter-spacing: 2px;">
            ${booking.qr_token.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
    
    <div class="ticket-footer">
      <p><strong>✓ Show this ticket at the door</strong></p>
      <p style="margin-top: 8px;">Save this file for your records</p>
    </div>
  </div>
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