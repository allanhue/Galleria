'use client'
import { useEffect, useState } from 'react'
import { events, Event } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    events.getAll()
      .then((res) => setMyEvents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/dashboard/create"
          className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          + Create event
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Events created', value: myEvents.length },
          { label: 'Total bookings',  value: 0  },
          { label: 'Community posts', value: 0  },
          { label: 'Followers',       value: 0  },
        ].map((stat) => (
          <div key={stat.label} className="border rounded-xl p-4 flex flex-col gap-1">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* My events */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-medium">Your events</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : myEvents.length === 0 ? (
          <p className="text-sm text-gray-400">
            No events yet.{' '}
            <Link href="/dashboard/create" className="underline">Create one</Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {myEvents.map((event) => (
              <div
                key={event.id}
                className="border rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-gray-400">{event.date} · {event.location}</p>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="text-xs border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}