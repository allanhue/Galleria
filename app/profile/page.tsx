'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { profile, ProfileData } from '@/app/lib/api'
import Cookies from 'js-cookie'
import {
  UserCircle2, Bookmark, Repeat2, MessageSquare,
  CalendarCheck, ChevronUp
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'posts' | 'saved' | 'reposted'>('posts')

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    profile.getMine()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400 mt-10">Loading profile...</p>
  if (!data) return <p className="text-sm text-gray-400 mt-10">Could not load profile.</p>

  const { user, my_posts, saved_posts, reposted_posts, stats } = data

  const activePosts =
    tab === 'posts' ? my_posts :
    tab === 'saved' ? saved_posts :
    reposted_posts

  return (
    <main className="max-w-2xl flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center gap-4 border border-[#E4E1D8] bg-white p-5">
        <div className="w-14 h-14 bg-[#EEEDFB] flex items-center justify-center">
          <UserCircle2 size={32} className="text-[#3730A9]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="inline-block text-xs bg-[#14131F] text-white px-2 py-0.5 mt-1 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ideas',    value: stats.posts,    icon: MessageSquare },
          { label: 'Saved',    value: stats.saved,    icon: Bookmark },
          { label: 'Reposts',  value: stats.reposts,  icon: Repeat2 },
          { label: 'Bookings', value: stats.bookings, icon: CalendarCheck },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="border border-[#E4E1D8] bg-white p-3 flex flex-col gap-1">
              <Icon size={15} className="text-[#3730A9]" />
              <span className="text-lg font-semibold">{s.value}</span>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E1D8]">
        {[
          { key: 'posts',    label: 'My ideas' },
          { key: 'saved',    label: 'Saved' },
          { key: 'reposted', label: 'Reposted' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`text-sm px-4 py-2.5 border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[#3730A9] text-[#3730A9] font-medium'
                : 'border-transparent text-gray-500 hover:text-[#14131F]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {activePosts.length === 0 ? (
          <div className="border border-[#E4E1D8] p-8 text-center text-gray-400 text-sm bg-white">
            Nothing here yet.
          </div>
        ) : (
          activePosts.map((post) => (
            <div key={post.id} className="border border-[#E4E1D8] bg-white p-4 flex flex-col gap-2">
              <h3 className="font-medium text-sm">{post.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{post.body}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <ChevronUp size={12} /> {post.votes}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark size={12} /> {post.saves}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 size={12} /> {post.reposts}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}