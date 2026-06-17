'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { events, Event, RSSItem } from '@/app/lib/api'

const categories = [
  'All', 'Music', 'Food & Drink', 'Art',
  'Sports', 'Networking', 'Tech', 'Culture'
]

function EventsContent() {
  const searchParams = useSearchParams()
  const [dbEvents, setDbEvents] = useState<Event[]>([])
  const [rssItems, setRssItems] = useState<RSSItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(searchParams.get('category') || '')

  useEffect(() => {
    setLoading(true)
    events.getAll({ category })
      .then((res) => {
        setDbEvents(res.data.events || [])
        setRssItems(res.data.rss || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="flex flex-col gap-6">
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

      {loading ? (
        <p className="text-gray-400 text-sm">Loading events...</p>
      ) : (
        <div className="flex flex-col gap-10">
          {dbEvents.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-medium text-gray-700">
                Upcoming in Globally
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-xl p-4 flex flex-col gap-2 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {event.category}
                      </span>
                      <span className="text-xs text-gray-400">{event.source}</span>
                    </div>
                    <h3 className="font-medium text-base">{event.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {event.date} · {event.location}
                    </p>
                    <a
                      href={`/events/${event.id}`}
                      className="mt-2 bg-black text-white text-sm py-2 rounded-lg text-center"
                    >
                      View & Book
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rssItems.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-medium text-gray-700">
                From around the web
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rssItems.map((item, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-4 flex flex-col gap-2 hover:shadow-sm transition"
                  >
                    <h3 className="font-medium text-sm line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3">
                      {item.description}
                    </p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 underline mt-auto"
                    >
                      Read more →
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dbEvents.length === 0 && rssItems.length === 0 && (
            <p className="text-gray-400 text-sm">
              No events found. Try a different category.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <Suspense fallback={<p className="text-gray-400 text-sm">Loading...</p>}>
        <EventsContent />
      </Suspense>
    </main>
  )
}