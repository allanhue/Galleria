'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import {
  Compass, CalendarDays, Users, Bookmark,
  LayoutDashboard, Menu, X, LogOut, UserCircle2, Gem, MessageSquare, Sparkles,
  type LucideIcon
} from 'lucide-react'
import NotificationBell from '@/app/components/notification_bell'
import { messages } from '@/app/lib/api'

type NavLink = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)

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

  //unread messages count
  useEffect(() => {
  const fetchUnread = () => {
    const token = Cookies.get('token')
    if (!token) return
    messages.getUnreadCount()
      .then((res) => setUnreadMessages(res.data.unread))
      .catch(console.error)
  }
  fetchUnread()
  const interval = setInterval(fetchUnread, 10000)
  return () => clearInterval(interval)
}, [user])


  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    setUser(null)
    setOpen(false)
    router.push('/auth/login')
  }

 const publicLinks: NavLink[] = [
  { href: '/',          label: 'Home',      icon: Compass },
  { href: '/events',    label: 'Events',    icon: CalendarDays },
  { href: '/community', label: 'Community', icon: Users },
]

const authLinks: NavLink[] = user ? [
  { href: '/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/messages',  label: 'Messages',  icon: MessageSquare,  badge: unreadMessages },
  { href: '/discover',  label: 'People',   icon: Sparkles },
  { href: '/profile',   label: 'Profile',  icon: UserCircle2 },
  ...(user?.role === 'organizer'
    ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    : []
  ),
] : []

const links = [...publicLinks, ...authLinks]

  return (
    <nav className="sticky top-0 z-10 border-b border-[#E4E1D8] bg-[#FAF9F6]/95 px-4 py-3 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center border border-[#E4E1D8] bg-white transition-colors group-hover:border-[#3730A9]">
            <Gem size={18} className="text-[#3730A9]" strokeWidth={2.2} />
          </span>
          <span className="text-lg">Galleria</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
{links.map((link) => {
  const Icon = link.icon
  const active = pathname === link.href
  return (
    <Link
      key={link.href}
      href={link.href}
      className={`relative flex items-center gap-1.5 border border-transparent px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-[#D9D6F5] bg-[#EEEDFB] font-medium text-[#3730A9]'
          : 'text-gray-500 hover:border-[#E4E1D8] hover:bg-white hover:text-[#14131F]'
      }`}
    >
      <Icon size={15} strokeWidth={2} />
      {link.label}
      {typeof link.badge === 'number' && link.badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-[#3730A9] text-[10px] text-white">
          {link.badge > 9 ? '9+' : link.badge}
        </span>
      )}
    </Link>
  )
})}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <span className="flex max-w-40 items-center gap-1.5 truncate border-l border-[#E4E1D8] pl-3 text-sm text-gray-500">
                <UserCircle2 size={16} className="shrink-0" />
                <span className="truncate">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 border border-[#E4E1D8] bg-white px-3 py-1.5 text-sm transition-colors hover:border-[#3730A9]/30 hover:text-[#3730A9]"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-gray-500 transition-colors hover:text-[#14131F]">
                Sign in
              </Link>
              <Link href="/auth/register" className="bg-[#14131F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3730A9]">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center border border-[#E4E1D8] bg-white text-gray-500 transition-colors hover:text-[#14131F] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-3 flex max-w-6xl flex-col gap-1 border-t border-[#E4E1D8] bg-[#FAF9F6] pt-3 md:hidden">
          {links.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-[#EEEDFB] text-[#3730A9] font-medium'
                    : 'text-gray-500 hover:bg-[#FAF9F6] hover:text-[#14131F]'
                }`}
              >
                <Icon size={16} />
                {item.label}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#3730A9] text-[10px] text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="mt-2 border-t border-[#E4E1D8] pt-2">
            {user ? (
              <>
                <p className="truncate px-3 py-1 text-xs text-gray-400">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-[#FAF9F6] hover:text-[#14131F]"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="mt-1 block bg-[#14131F] px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#3730A9]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
