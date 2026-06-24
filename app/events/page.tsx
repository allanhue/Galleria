'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { events, Event, RSSItem } from '@/app/lib/api'
import Spinner from '@/app/components/spinner'
import { Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const categories = [
  'All', 'Music', 'Food & Drink', 'Art',
  'Sports', 'Networking', 'Tech', 'Culture',
]

function EventsContent() {
  const searchParams = useSearchParams()
  const [dbEvents, setDbEvents] = useState<Event[]>([])
  const [rssItems, setRssItems] = useState<RSSItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setLoading(true)
    events
      .getAll({ category, search: debouncedSearch })
      .then((res) => {
        setDbEvents(res.data.events || [])
        setRssItems(res.data.rss || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, debouncedSearch])

  return (
    <div className="flex flex-col gap-6">

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          placeholder="Search events, venues, cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#E4E1D8] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
        />
      </div>

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
        <Spinner label="Loading events..." />
      ) : (
        <div className="flex flex-col gap-10">

          {dbEvents.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-medium text-gray-700">Upcoming globally</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-[#E4E1D8] bg-white flex flex-col hover:shadow-sm transition"
                  >
                    {event.photo_urls && event.photo_urls.length > 0 ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={event.photo_urls[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-[#FAF9F6] flex items-center justify-center">
                        <span className="w-2 h-2 bg-[#3730A9]" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-wide text-gray-400">
                        {event.category}
                      </span>
                      <h3 className="font-medium text-base">{event.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                      <p className="text-xs text-gray-400">{event.date} · {event.location}</p>
                      <Link
                        href={`/events/${event.id}`}
                        className="mt-2 bg-[#14131F] text-white text-sm py-2 text-center hover:bg-[#3730A9] transition-colors"
                      >
                        View and Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rssItems.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-medium text-gray-700">From around the web</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rssItems.map((item, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-4 flex flex-col gap-2 hover:shadow-sm transition"
                  >
                    <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3">{item.description}</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 underline mt-auto flex items-center gap-1"
                    >
                      Read more <ArrowRight size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dbEvents.length === 0 && rssItems.length === 0 && (
            <p className="text-gray-400 text-sm">No events found.</p>
          )}

        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  return (
    <main className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-gray-400 text-sm">Loading...</p>}>
        <EventsContent />
      </Suspense>
    </main>
  )
}