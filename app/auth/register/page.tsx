'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/app/lib/api'

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
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join Galleria and discover events
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Full name</label>
            <input
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">I am joining as</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="attendee">Attendee — discover and book events</option>
              <option value="organizer">Organizer — create and manage events</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <a href="/auth/login" className="text-black underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  )
}