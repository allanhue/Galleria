'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { events, EventDetail } from '@/app/lib/api'
import Cookies from 'js-cookie'
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Spinner from '@/app/components/spinner'

export default function EventDetailClient() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
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
      <div className="bg-white border border-[#E4E1D8] overflow-hidden">
        <div className="p-8 flex flex-col gap-6">

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
            <span className="w-1.5 h-1.5 bg-[#3730A9]" />
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {event.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              {event.title}
            </h1>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Info Row */}
          <div className="flex flex-wrap gap-6 py-5 border-y border-[#E4E1D8] text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} />
              {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} />
              {event.location}
            </span>
            <span className={`flex items-center gap-1.5 ${event.sold_out ? 'text-red-500 font-medium' : ''}`}>
              <Users size={15} />
              {event.sold_out ? 'Sold out' : `${event.spots_remaining} spots left`}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Booking Section */}
          <div>
            {booked ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-medium">
                <CheckCircle2 size={16} />
                You are booked. Check your email for confirmation.
              </div>
            ) : event.sold_out ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 px-5 py-4 text-sm font-medium w-fit">
                This event is sold out
              </div>
            ) : (
              <button
                onClick={handleBook}
                disabled={booking}
                className="bg-[#14131F] text-white px-8 py-3 text-sm font-medium w-fit disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
              >
                {booking ? 'Booking...' : 'Book my spot'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}