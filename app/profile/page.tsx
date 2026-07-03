'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { profile, ProfileData } from '@/app/lib/api'
import Spinner from '@/app/components/spinner'
import { uploadImage } from '@/app/lib/upload'
import Cookies from 'js-cookie'
import {
  UserCircle2, Bookmark, Repeat2, MessageSquare,
  CalendarCheck, ChevronUp, Camera, Loader2,
  LogOut, LayoutDashboard
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'posts' | 'saved' | 'reposted'>('posts')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return
    setUploadingAvatar(true)
    try {
      const url = await uploadImage(file)
      await profile.updateAvatar(url)
      setData({ ...data, user: { ...data.user, avatar_url: url } })
      const storedUser = Cookies.get('user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        Cookies.set('user', JSON.stringify({ ...parsed, avatar_url: url }), { expires: 7 })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) return <Spinner label="Loading profile..." />
  if (!data) return <p className="text-sm text-gray-400 mt-10">Could not load profile.</p>

  const { user, my_posts, saved_posts, reposted_posts, stats } = data

  const activePosts =
    tab === 'posts' ? (my_posts || []) :
    tab === 'saved' ? (saved_posts || []) :
    (reposted_posts || [])

  return (
    <main className="max-w-2xl flex flex-col gap-10">

      {/* Header */}
      <div className="flex items-center gap-5 pb-6 border-b border-[#E4E1D8]">
        <button
          onClick={handleAvatarClick}
          className="relative w-20 h-20 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden group shrink-0"
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <UserCircle2 size={40} className="text-[#3730A9]" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingAvatar ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="inline-flex w-fit items-center gap-1 text-xs text-[#3730A9] font-medium uppercase tracking-wide mt-0.5">
            <span className="w-1.5 h-1.5 bg-[#3730A9] rounded-full" />
            {user.role}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8">
        {[
          { label: 'Ideas',    value: stats.posts,    icon: MessageSquare },
          { label: 'Saved',    value: stats.saved,    icon: Bookmark },
          { label: 'Reposts',  value: stats.reposts,  icon: Repeat2 },
          { label: 'Bookings', value: stats.bookings, icon: CalendarCheck },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Icon size={12} />
                {s.label}
              </span>
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
            className={`text-sm px-4 py-2.5 border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-[#3730A9] text-[#3730A9] font-medium'
                : 'border-transparent text-gray-500 hover:text-[#14131F]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="flex flex-col gap-3">
        {activePosts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
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

      {/* Actions — bottom of profile */}
      <div className="flex flex-col gap-3 border-t border-[#E4E1D8] pt-6">
        {user?.role === 'organizer' && (
          <NextLink
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#14131F] border border-[#E4E1D8] px-4 py-2.5 w-fit transition-colors"
          >
            <LayoutDashboard size={15} />
            Organizer dashboard
          </NextLink>
        )}
        <button
          onClick={() => {
            Cookies.remove('token')
            Cookies.remove('user')
            router.push('/auth/login')
          }}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors w-fit"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

    </main>
  )
}