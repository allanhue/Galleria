'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { events, Event } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import { Bookmark, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function SavedEventsPage() {
  const router = useRouter()
  const [saved, setSaved] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/auth/login'); return }
    events.getSavedEvents()
      .then((res) => setSaved(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading saved events..." />

  return (
    <main className="max-w-2xl flex flex-col gap-6">
      {saved.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-10 text-center flex flex-col items-center gap-3">
          <Bookmark size={28} className="text-gray-300" />
          <p className="text-sm text-gray-400">No saved events yet.</p>
          <Link href="/events" className="text-sm text-[#3730A9] underline">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="border border-[#E4E1D8] bg-white flex gap-4 p-4 hover:bg-[#FAF9F6] transition-colors"
            >
              {event.photo_urls?.[0] ? (
                <div className="w-20 h-20 shrink-0 overflow-hidden">
                  <img
                    src={event.photo_urls[0]}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 shrink-0 bg-[#EEEDFB] flex items-center justify-center">
                  <span className="w-2 h-2 bg-[#3730A9]" />
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {event.category}
                </span>
                <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={11} /> {event.date}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin size={11} /> {event.location}
                </p>
                {!event.is_free && (
                  <p className="text-xs text-[#3730A9] font-medium mt-0.5">
                    KES {event.price?.toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}