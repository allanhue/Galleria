'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gem } from 'lucide-react'
import { auth } from '@/app/lib/api'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.9-1.7 3-4.2 3-7.1z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.2v2.5C4.9 19.7 8.2 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3.2C2.4 8.9 2 10.4 2 12s.4 3.1 1.2 4.4l3.2-2.5z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2 8.2 2 4.9 4.3 3.2 7.6l3.2 2.5C7.2 7.8 9.4 6 12 6z" />
    </svg>
  )
}

function XBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="currentColor" d="M13.9 10.5 21.3 2h-1.8l-6.4 7.4L8 2H2l7.8 11.3L2 22h1.8l6.8-7.8L16 22h6l-8.1-11.5zm-2.4 2.7-.8-1.1L4.4 3.3h2.8l5 7.1.8 1.1 6.6 9.3h-2.8l-5.3-7.6z" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'attendee',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await auth.register(form)
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-112px)] items-center justify-center py-8">
      <section className="w-full" style={{ maxWidth: 380 }}>
        <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center border border-[#E4E1D8] bg-white">
            <Gem size={18} className="text-[#3730A9]" />
          </span>
          Galleria
        </div>

        <div className="border border-[#E4E1D8] bg-white shadow-[0_16px_45px_rgba(20,19,31,0.06)]">
          <div className="h-1 bg-[#3730A9]" />
          <div className="p-5 sm:p-6">
            <div className="border-b border-[#E4E1D8] pb-5">
              <p className="text-xs uppercase tracking-wide text-[#3730A9]">New account</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create account</h1>
            </div>

          {error && (
            <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm font-medium transition-colors hover:border-[#3730A9] hover:text-[#3730A9]"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm font-medium transition-colors hover:border-[#3730A9] hover:text-[#3730A9]"
            >
              <XBrandIcon />
              X
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#E4E1D8]" />
            <span className="text-xs text-gray-400">or use email</span>
            <span className="h-px flex-1 bg-[#E4E1D8]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Full name</label>
              <input
                placeholder="Michael Johnson"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E4E1D8] bg-[#FAF9F6] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#3730A9] focus:bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="michael@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[#E4E1D8] bg-[#FAF9F6] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#3730A9] focus:bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#E4E1D8] bg-[#FAF9F6] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#3730A9] focus:bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">I am joining as</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-[#E4E1D8] bg-[#FAF9F6] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#3730A9] focus:bg-white"
              >
                <option value="attendee">Attendee - discover and book events</option>
                <option value="organizer">Organizer - create and manage events</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-[#14131F] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3730A9] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 border-t border-[#E4E1D8] pt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-[#14131F] underline decoration-[#3730A9]/30 underline-offset-4 hover:text-[#3730A9]">
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </section>
    </main>
  )
}
