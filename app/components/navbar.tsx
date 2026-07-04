'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import {
  Compass, Search, CalendarDays, Sparkles,
  UserCircle2, LogOut, Gem, MessageSquare,
  Bookmark
} from 'lucide-react'
import NotificationBell from '@/app/components/notification_bell'
import { messages } from '@/app/lib/api'
import type { LucideIcon } from 'lucide-react'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  authOnly?: boolean
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const readUser = () => {
      const stored = Cookies.get('user')
      if (stored) {
        try { setUser(JSON.parse(stored)) }
        catch { Cookies.remove('user'); setUser(null) }
      } else {
        setUser(null)
      }
    }
    readUser()
    window.addEventListener('focus', readUser)
    return () => window.removeEventListener('focus', readUser)
  }, [pathname])

  useEffect(() => {
    const fetch = () => {
      const token = Cookies.get('token')
      if (!token) return
      messages.getUnreadCount()
        .then((res) => setUnread(res.data.unread))
        .catch(console.error)
    }
    fetch()
    const interval = setInterval(fetch, 10000)
    return () => clearInterval(interval)
  }, [user])

  const bottomLinks: NavLink[] = [
    { href: '/',          label: 'Home',    icon: Compass },
    // { href: '/events',    label: 'Explore', icon: Search },
    { href: '/community', label: 'Community',  icon: CalendarDays },
    { href: '/discover',  label: 'People',  icon: Sparkles },
    { href: '/bookings', label: 'Bookings', icon: Bookmark },
    { href: '/profile',   label: 'Profile', icon: UserCircle2, authOnly: true },
    ...(!user ? [{ href: '/auth/login', label: 'Sign in', icon: UserCircle2 }] : []),
  ]

  const visibleLinks = bottomLinks.filter(l => !l.authOnly || user)

  return (
    <>
      {/* ── Top bar (mobile + desktop) ── */}
      <nav className="sticky top-0 z-20 border-b border-[#E4E1D8] bg-[#FAF9F6]/95 backdrop-blur px-4 h-12 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-7 h-7 border border-[#E4E1D8] flex items-center justify-center group-hover:border-[#3730A9] transition-colors">
            <Gem size={15} className="text-[#3730A9]" strokeWidth={2.2} />
          </span>
          <span className="font-semibold text-base tracking-tight">Galleria</span>
        </Link>

        {/* Desktop center links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 border border-transparent transition-colors ${
                  active
                    ? 'border-[#D9D6F5] bg-[#EEEDFB] text-[#3730A9] font-medium'
                    : 'text-gray-500 hover:text-[#14131F] hover:border-[#E4E1D8] hover:bg-white'
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Messages — mobile and desktop */}
              <Link href="/messages" className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#3730A9] transition-colors">
                <MessageSquare size={18} strokeWidth={1.8} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#3730A9] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Notification bell */}
              <NotificationBell />

              {/* Sign out — desktop only */}
              <button
                onClick={() => {
                  Cookies.remove('token')
                  Cookies.remove('user')
                  setUser(null)
                  router.push('/auth/login')
                }}
                className="hidden md:flex items-center gap-1.5 text-sm border border-[#E4E1D8] px-3 py-1.5 text-gray-500 hover:text-[#3730A9] hover:border-[#3730A9]/30 transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-[#14131F] transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm bg-[#14131F] text-white px-4 py-1.5 hover:bg-[#3730A9] transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 bg-[#FAF9F6]/95 backdrop-blur border-t border-[#E4E1D8] flex items-center px-2 pb-1">
        {visibleLinks.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? 'text-[#3730A9]' : 'text-gray-400 hover:text-[#14131F]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9px] font-semibold">{link.label}</span>
            </Link>
          )
        })}
      </div>

      {/* ── Body padding for fixed bars ── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body { padding-bottom: 64px; }
        }
      `}</style>
    </>
  )
}