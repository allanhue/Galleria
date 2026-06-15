'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { events, Booking } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'

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
    events.getMyBookings()
      .then((res) => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Events you have booked
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-gray-400 text-sm">
          No bookings yet.{' '}
          <Link href="/events" className="underline text-black">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">
                  {booking.event?.title || 'Event'}
                </p>
                <p className="text-xs text-gray-400">
                  {booking.event?.date} · {booking.event?.location}
                </p>
                <span className={`text-xs w-fit px-2 py-0.5 rounded-full mt-1 ${
                  booking.status === 'confirmed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {booking.status}
                </span>
              </div>
              <Link
                href={`/events/${booking.event_id}`}
                className="text-xs border px-3 py-1.5 rounded-lg hover:bg-white transition"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}