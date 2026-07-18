'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { analytics, EventAnalytics } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import {
  Users, Star, ThumbsUp, ThumbsDown,
  Bookmark, Clock, TrendingUp, ArrowLeft,
  DollarSign
} from 'lucide-react'

export default function EventAnalyticsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<EventAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/auth/login'); return }
    analytics.getEvent(Number(id))
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner label="Loading analytics..." />
  if (!data) return null

  const stats = [
    { label: 'Booked',      value: data.booked,       icon: Users,      color: 'text-[#3730A9]' },
    { label: 'Checked in',  value: data.checked_in,   icon: TrendingUp, color: 'text-green-600' },
    { label: 'Waitlist',    value: data.waitlist,      icon: Clock,      color: 'text-yellow-600' },
    { label: 'Revenue KES', value: data.revenue_kes.toLocaleString(), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Likes',       value: data.likes,         icon: ThumbsUp,   color: 'text-blue-500' },
    { label: 'Dislikes',    value: data.dislikes,      icon: ThumbsDown, color: 'text-red-400' },
    { label: 'Saves',       value: data.saves,         icon: Bookmark,   color: 'text-purple-500' },
    { label: 'Avg rating',  value: data.avg_rating > 0 ? `${data.avg_rating.toFixed(1)} ★` : '—', icon: Star, color: 'text-yellow-500' },
  ]

  const maxBookings = Math.max(...(data.daily_bookings?.map(d => d.count) || [1]), 1)

  return (
    <main className="max-w-2xl flex flex-col gap-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#14131F] w-fit"
      >
        <ArrowLeft size={14} />
        Dashboard
      </button>

      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Analytics</p>
        <h1 className="text-xl font-semibold tracking-tight mt-0.5">{data.event.title}</h1>
      </div>

      {/* Fill rate bar */}
      <div className="border border-[#E4E1D8] bg-white p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Capacity filled</span>
          <span className="font-semibold">{data.fill_rate}%</span>
        </div>
        <div className="h-2 bg-[#FAF9F6] overflow-hidden">
          <div
            className="h-full bg-[#3730A9] transition-all"
            style={{ width: `${Math.min(data.fill_rate, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">{data.booked} of {data.capacity} spots filled</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="border border-[#E4E1D8] bg-white p-4 flex flex-col gap-1">
              <Icon size={16} className={s.color} />
              <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Daily bookings chart */}
      {data.daily_bookings && data.daily_bookings.length > 0 && (
        <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Bookings over time</p>
          <div className="flex items-end gap-1 h-24">
            {data.daily_bookings.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#3730A9] min-h-[2px] transition-all"
                  style={{ height: `${(d.count / maxBookings) * 80}px` }}
                />
                <span className="text-[9px] text-gray-400 truncate w-full text-center">
                  {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}