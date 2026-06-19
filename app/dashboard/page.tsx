'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { events, Event } from '@/app/lib/api'
import Spinner from '@/app/components/spinner'
import Cookies from 'js-cookie'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = Cookies.get('user')
    if (!stored) {
      router.push('/auth/login')
      return
    }
    const parsed = JSON.parse(stored)
    setUser(parsed)

    events.getAll()
      .then((res) => setMyEvents(res.data.events || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back{user ? `, ${user.name}` : ''}
          </p>
        </div>
        {user?.role === 'organizer' && (
          <Link
            href="/dashboard/create"
            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            + Create event
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Events',     value: myEvents.length },
          { label: 'Bookings',   value: 0               },
          { label: 'Posts',      value: 0               },
          { label: 'Following',  value: 0               },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border rounded-xl p-4 flex flex-col gap-1 bg-gray-50"
          >
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Role badge */}
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-xs bg-black text-white px-3 py-1 rounded-full capitalize">
            {user.role}
          </span>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Events in Nairobi</h2>
          <Link href="/events" className="text-sm text-gray-500 hover:text-black">
            View all →
          </Link>
        </div>

        {loading ? (
          <Spinner label="Loading events..." />
        ) : myEvents.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-gray-400 text-sm">
            No events yet.{' '}
            {user?.role === 'organizer' && (
              <Link href="/dashboard/create" className="underline text-black">
                Create one
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myEvents.map((event) => (
              <div
                key={event.id}
                className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-gray-400">
                    {event.date} · {event.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {event.category}
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs border px-3 py-1.5 rounded-lg hover:bg-white transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}