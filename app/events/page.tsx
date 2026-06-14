'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { events, Event } from '@/lib/api'
import EventCard from '@/components/eventcard'

const categories = ['All', 'Music', 'Food & Drink', 'Art', 'Sports', 'Networking', 'Outdoors', 'Tech', 'Culture']

export default function EventsPage() {
  const searchParams = useSearchParams()
  const [eventList, setEventList] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(searchParams.get('category') || '')

  useEffect(() => {
    setLoading(true)
    events.getAll({ category })
      .then((res) => setEventList(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Events</h1>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === 'All' ? '' : cat)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              (cat === 'All' && category === '') || category === cat
                ? 'bg-black text-white border-black'
                : 'text-gray-500 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events grid */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading events...</p>
      ) : eventList.length === 0 ? (
        <p className="text-gray-400 text-sm">No events found. Try a different category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventList.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  )
}