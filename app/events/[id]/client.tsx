'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { events, Event } from '@/app/lib/api'
import Cookies from 'js-cookie'

export default function EventDetailClient() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [booked, setBooked] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    events.getOne(Number(id))
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setBooking(true)
    setError('')
    try {
      await events.book(Number(id))
      setBooked(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <p className="text-sm text-gray-400 mt-10">Loading event...</p>
  )

  if (!event) return (
    <p className="text-sm text-gray-400 mt-10">Event not found.</p>
  )

  return (
    <main className="max-w-2xl flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <a href="/events" className="text-sm text-gray-400 hover:text-black">
          ← Back to events
        </a>
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full w-fit">
          {event.category}
        </span>
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>📅 {event.date}</span>
          <span>📍 {event.location}</span>
          <span>👥 {event.capacity} spots</span>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed">{event.description}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {booked ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl text-sm font-medium">
          ✓ You are booked! Check your email for confirmation.
        </div>
      ) : (
        <button
          onClick={handleBook}
          disabled={booking}
          className="bg-black text-white px-8 py-3 rounded-xl text-sm font-medium w-fit disabled:opacity-50"
        >
          {booking ? 'Booking...' : 'Book my spot'}
        </button>
      )}
    </main>
  )
}