'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/',           label: 'Discover'   },
    { href: '/events',     label: 'Events'     },
    { href: '/community',  label: 'Community'  },
    { href: '/dashboard',  label: 'Dashboard'  },
  ]

  const handleLogout = () => {
    Cookies.remove('token')
    router.push('/auth/login')
  }

  return (
    <nav className="border-b px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <Link href="/" className="font-semibold text-lg tracking-tight">
          Galleria
        </Link>

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

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-gray-500 hover:text-black"
          >
            Sign in
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm border px-4 py-1.5 rounded-lg hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>

      </div>
    </nav>
  )
}