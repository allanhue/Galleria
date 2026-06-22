'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { organizerTools, AttendeesResponse } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import { ArrowLeft, Users, UserCircle2 } from 'lucide-react'

export default function AttendeesPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<AttendeesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    organizerTools.getAttendees(Number(id))
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load attendees'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner label="Loading attendees..." />

  if (error) return (
    <main className="max-w-2xl">
      <p className="text-sm text-red-500">{error}</p>
    </main>
  )

  if (!data) return null

  return (
    <main className="max-w-2xl flex flex-col gap-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#14131F] w-fit"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </button>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{data.event.title}</h1>
        <p className="text-sm text-gray-500">{data.event.date} · {data.event.location}</p>
      </div>

      <div className="flex items-center gap-6 border border-[#E4E1D8] bg-white p-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-semibold">{data.total}</span>
          <span className="text-xs text-gray-400">Booked</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-semibold">{data.capacity}</span>
          <span className="text-xs text-gray-400">Capacity</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-semibold">{data.percentage}%</span>
          <span className="text-xs text-gray-400">Filled</span>
        </div>
        <div className="flex-1 h-1.5 bg-[#FAF9F6] overflow-hidden">
          <div
            className="h-full bg-[#3730A9]"
            style={{ width: `${Math.min(data.percentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 flex items-center gap-2">
          <Users size={14} />
          Attendees
        </h2>

        {data.attendees.length === 0 ? (
          <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
            No bookings yet.
          </div>
        ) : (
          <div className="border border-[#E4E1D8] bg-white">
            {data.attendees.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#E4E1D8] last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden shrink-0">
                  {a.user?.avatar_url ? (
                    <img src={a.user.avatar_url} alt={a.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 size={18} className="text-[#3730A9]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{a.user?.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}