'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react'
import { events, Booking } from '@/app/lib/api'
import Spinner from '@/app/components/spinner'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    events
      .getMyBookings()
      .then((res) => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="border-b border-[#E4E1D8] pb-5">
        <p className="text-xs uppercase tracking-wide text-[#3730A9]">My bookings</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mt-1 text-sm text-gray-500">
              Keep track of events you have reserved a spot for.
            </p>
          </div>
          <Link
            href="/events"
            className="w-fit border border-[#E4E1D8] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[#3730A9] hover:text-[#3730A9]"
          >
            Browse events
          </Link>
        </div>
      </header>

      {loading ? (
        <Spinner label="Loading bookings..." />
      ) : bookings.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-[#EEEDFB]">
            <Ticket size={22} className="text-[#3730A9]" />
          </div>
          <h2 className="text-base font-medium">No bookings yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            Discover events you like and reserve your place when you are ready.
          </p>
          <Link
            href="/events"
            className="mt-5 inline-flex items-center gap-2 bg-[#14131F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3730A9]"
          >
            Browse events
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-[#E4E1D8] bg-white p-4 transition hover:border-[#D9D6F5] hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center bg-[#EEEDFB] sm:flex">
                    <Ticket size={20} className="text-[#3730A9]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="line-clamp-1 text-sm font-medium">
                        {booking.event?.title || 'Event'}
                      </h2>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:gap-3">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-gray-400" />
                        {booking.event?.date || 'Date pending'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-gray-400" />
                        {booking.event?.location || 'Location pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/events/${booking.event_id}`}
                  className="inline-flex items-center justify-center gap-2 border border-[#E4E1D8] px-4 py-2 text-sm font-medium transition-colors hover:border-[#3730A9] hover:text-[#3730A9] sm:shrink-0"
                >
                  View
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
