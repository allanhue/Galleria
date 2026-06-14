'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { events, Event } from '@/lib/api'

export default function EventDetailPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    events.getOne(Number(id))
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    try {
      await events.book(Number(id))
      setBooked(true)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Booking failed')
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!event)  return <p className="text-sm text-gray-400">Event not found.</p>

  return (
    <main className="max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full w-fit">
          {event.category}
        </span>
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <p className="text-gray-500 text-sm">{event.date} · {event.location}</p>
      </div>

      <p className="text-gray-700 leading-relaxed">{event.description}</p>

      <div className="border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Capacity</p>
          <p className="text-sm text-gray-500">{event.capacity} spots</p>
        </div>
        <button
          onClick={handleBook}
          disabled={booked}
          className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {booked ? 'Booked ✓' : 'Book spot'}
        </button>
      </div>
    </main>
  )
}