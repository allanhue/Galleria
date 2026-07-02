'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Music,
  UtensilsCrossed,
  Palette,
  Footprints,
  Handshake,
  Leaf,
  Code,
  Building2,
} from 'lucide-react'
import { events, TrendingEvent } from '@/app/lib/api'

export default function HomePage() {
  const [trending, setTrending] = useState<TrendingEvent[]>([])

  useEffect(() => {
    events
      .getTrending()
      .then((res) => setTrending(res.data || []))
      .catch(console.error)
  }, [])

  const categories = [
    { label: 'Music', Icon: Music },
    { label: 'Food & Drink', Icon: UtensilsCrossed },
    { label: 'Art', Icon: Palette },
    { label: 'Sports', Icon: Footprints },
    { label: 'Networking', Icon: Handshake },
    { label: 'Outdoors', Icon: Leaf },
    { label: 'Tech', Icon: Code },
    { label: 'Culture', Icon: Building2 },
  ]

  return (
    <main className="flex flex-col gap-10">

      {/* Hero */}
      <section className="flex flex-col gap-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          Discover events.<br />Connect with people.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl">
          Find events happening around you, book your spot and shape
          what happens next with your community.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/events"
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse events
          </Link>
          <Link
            href="/auth/register"
            className="border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Join Galleria
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.label}`}
              className="border rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <cat.Icon className="w-6 h-6 text-gray-700" />
              <span className="text-sm font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#3730A9]">
                Trending now
              </p>
              <h2 className="mt-1 text-lg font-medium">Popular with the community</h2>
            </div>
            <Link
              href="/events"
              className="hidden text-sm font-medium text-gray-500 hover:text-[#3730A9] sm:block"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group overflow-hidden border border-[#E4E1D8] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(20,19,31,0.08)]"
              >
                {event.photo_urls && event.photo_urls.length > 0 ? (
                  <div className="aspect-video overflow-hidden bg-[#FAF9F6]">
                    <img
                      src={event.photo_urls[0]}
                      alt={event.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-[#EEEDFB] p-4">
                    <div className="flex h-full items-center justify-center border border-[#D9D6F5] bg-white/45">
                      <span className="h-2 w-2 bg-[#3730A9]" />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="bg-[#EEEDFB] px-2 py-1 text-[11px] font-medium text-[#3730A9]">
                      {event.category}
                    </span>
                    <span className="text-xs font-medium text-[#3730A9]">
                      {event.booking_count} {event.booking_count === 1 ? 'person' : 'people'} going
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-medium">{event.title}</p>
                  <p className="line-clamp-1 text-xs text-gray-400">{event.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Community CTA */}
      <section className="border rounded-xl p-6 flex flex-col gap-3 bg-gray-50">
        <h2 className="text-lg font-medium">Have an idea for an event?</h2>
        <p className="text-sm text-gray-500">
          Post it to the community. Let people vote, comment and make it happen.
        </p>
        <Link
          href="/community"
          className="self-start border bg-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          Go to community
        </Link>
      </section>

    </main>
  )
}
