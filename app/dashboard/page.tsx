'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { analytics, events, Event, organizerTools } from '@/app/lib/api'
import Spinner from '@/app/components/spinner'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { BarChart2, Pencil, QrCode, Trash2, Users } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [overview, setOverview] = useState<any>(null)

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

    analytics.getOverview()
      .then((res) => setOverview(res.data))
      .catch(console.error)
  }, [])

  const handleDelete = async (eventId: number) => {
    if (!confirm('Delete this event permanently?')) return
    try {
      await events.delete(eventId)
      setMyEvents(myEvents.filter((e) => e.id !== eventId))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  const myOwnEvents = user
    ? myEvents.filter((e) => e.organizer_id === user.id)
    : []

  return (
    <main className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-end">
        {user?.role === 'organizer' && (
          <Link
            href="/dashboard/create"
            className="bg-[#14131F] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#3730A9] transition-colors"
          >
            + Create event
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Your events', value: overview?.total_events ?? 0 },
          { label: 'Total bookings', value: overview?.total_bookings ?? 0 },
          { label: 'Revenue KES', value: overview?.total_revenue ?? 0 },
          { label: 'This week', value: overview?.bookings_week ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="border border-[#E4E1D8] p-4 flex flex-col gap-1 bg-white">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            All events
          </h2>
          <Link href="/events" className="text-sm text-gray-500 hover:text-[#14131F]">
            View all →
          </Link>
        </div>

        {loading ? (
          <Spinner label="Loading events..." />
        ) : myEvents.length === 0 ? (
          <div className="border border-[#E4E1D8] p-8 text-center text-gray-400 text-sm bg-white">
            No events yet.{' '}
            {user?.role === 'organizer' && (
              <Link href="/dashboard/create" className="underline text-[#14131F]">
                Create one
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myEvents
              .filter((event) => event?.id)
              .map((event) => (
                <div
                  key={event.id}
                  className="border border-[#E4E1D8] bg-white p-4 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors"
                >
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-gray-400">
                    {event.date} · {event.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#FAF9F6] border border-[#E4E1D8] px-2 py-1">
                    {event.category}
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] transition-colors"
                  >
                    View
                  </Link>
                  {user?.role === 'organizer' && event.organizer_id === user.id && (
                    <>
                      <Link
                        href={`/dashboard/attendees/${event.id}`}
                        className="text-xs border border-[#E4E1D8] p-1.5 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <Users size={13} />
                      </Link>
                      <Link
                        href={`/dashboard/checkin/${event.id}`}
                        className="text-xs border border-[#E4E1D8] p-1.5 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <QrCode size={13} />
                      </Link>
                      <Link
                        href={`/dashboard/analytics/${event.id}`}
                        className="text-xs border border-[#E4E1D8] p-1.5 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <BarChart2 size={13} />
                      </Link>
                      <Link
                        href={`/dashboard/edit/${event.id}`}
                        className="text-xs border border-[#E4E1D8] p-1.5 hover:bg-[#FAF9F6] transition-colors"
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-xs border border-[#E4E1D8] p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}