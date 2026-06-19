'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { events, Event } from '@/app/lib/api'
import Cookies from 'js-cookie'
import { Calendar, MapPin, Users, ArrowLeft, Loader2 } from 'lucide-react'
import Spinner from '@/app/components/spinner'

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

  if (loading) return <Spinner label="Loading event..." />

  if (!event) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-500">Event not found.</p>
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to events</span>
        </button>
      </div>

      {/* Event Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Event Details Section */}
        <div className="p-8 space-y-6">
          {/* Photos Gallery */}
          {event.photo_urls && event.photo_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {event.photo_urls.map((url, i) => (
                <div key={i} className={`overflow-hidden ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              {event.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
          </div>

          {/* Event Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-y border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">DATE</p>
                <p className="text-sm font-semibold text-gray-900">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">LOCATION</p>
                <p className="text-sm font-semibold text-gray-900">{event.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">CAPACITY</p>
                <p className="text-sm font-semibold text-gray-900">{event.capacity} spots</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Booking Section */}
          <div className="pt-4">
            {booked ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-sm font-medium flex items-center gap-2">
                <span className="text-xl">✓</span>
                <div>
                  <p className="font-semibold">You are booked!</p>
                  <p className="text-xs text-green-600 mt-1">Check your email for confirmation details.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full bg-black text-white px-8 py-4 rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book my spot'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}