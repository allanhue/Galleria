'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)

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

  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    setUser(null)
    setOpen(false)
    router.push('/auth/login')
  }

  const links = [
    { href: '/',          label: 'Discover'  },
    { href: '/events',    label: 'Events'    },
    { href: '/community', label: 'Community' },
    { href: '/bookings',  label: 'My Bookings' },
    ...(user?.role === 'organizer'
      ? [{ href: '/dashboard', label: 'Dashboard' }]
      : []
    ),
  ]

  return (
    <nav className="border-b px-4 py-3 sticky top-0 bg-white z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <Link href="/" className="font-semibold text-lg tracking-tight">
          Galleria
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${
                pathname === link.href
                  ? 'text-black font-medium'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm border px-4 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-black">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm bg-black text-white px-4 py-1.5 rounded-lg">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-500 hover:text-black"
          onClick={() => setOpen(!open)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t mt-3 pt-3 flex flex-col gap-1 px-2 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm px-3 py-2.5 rounded-lg ${
                pathname === link.href
                  ? 'bg-gray-100 text-black font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t mt-2 pt-2">
            {user ? (
              <>
                <p className="text-xs text-gray-400 px-3 py-1">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block text-sm px-3 py-2.5 text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block text-sm px-3 py-2.5 bg-black text-white rounded-lg mt-1 text-center"
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