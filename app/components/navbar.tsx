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
    <nav className="border-b border-[#E4E1D8] px-4 py-3 sticky top-0 bg-[#FAF9F6] z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <Link href="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
          <Gem size={20} className="text-[#3730A9]" strokeWidth={2.2} />
          Galleria
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
      className={`relative flex items-center gap-1.5 text-sm px-3 py-1.5 transition-colors ${
        active
          ? 'text-[#3730A9] font-medium bg-[#EEEDFB]'
          : 'text-gray-500 hover:text-[#14131F]'
      }`}
    >
      <Icon size={15} strokeWidth={2} />
      {link.label}
      {typeof link.badge === 'number' && link.badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#3730A9] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
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
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <UserCircle2 size={16} />
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm border border-[#E4E1D8] px-3 py-1.5 hover:bg-white transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-[#14131F]">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm bg-[#14131F] text-white px-4 py-1.5">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-500 hover:text-[#14131F]"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#E4E1D8] mt-3 pt-3 flex flex-col gap-1 px-2 pb-3">
          {links.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`relative flex items-center gap-2.5 text-sm px-3 py-2.5 ${
                  active
                    ? 'bg-[#EEEDFB] text-[#3730A9] font-medium'
                    : 'text-gray-500 hover:bg-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="ml-auto bg-[#3730A9] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="border-t border-[#E4E1D8] mt-2 pt-2">
            {user ? (
              <>
                <p className="text-xs text-gray-400 px-3 py-1">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 text-left text-sm px-3 py-2.5 text-red-500 hover:bg-red-50"
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
                  className="block text-sm px-3 py-2.5 text-gray-500 hover:bg-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block text-sm px-3 py-2.5 bg-[#14131F] text-white mt-1 text-center"
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