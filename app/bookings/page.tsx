'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { events, Booking } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import Spinner from '@/app/components/spinner'
import { QRCodeSVG } from 'qrcode.react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

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
                <Link
                  href={`/events/${booking.event_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] transition-colors"
                >
                  View
                </Link>
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