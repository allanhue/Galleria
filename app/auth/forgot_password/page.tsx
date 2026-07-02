'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/app/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div className="w-12 h-12 bg-[#EEEDFB] flex items-center justify-center mx-auto">
          <span className="text-[#3730A9] text-xl">✉</span>
        </div>
        <p className="text-base font-medium">Check your email</p>
        <p className="text-sm text-gray-500">
          If that email exists you will receive a 6-digit reset code shortly.
        </p>
        <button
          onClick={() => router.push('/auth/reset-password')}
          className="bg-[#14131F] text-white py-2.5 text-sm font-medium hover:bg-[#3730A9] transition-colors"
        >
          Enter reset code
        </button>
        <a href="/auth/login" className="text-sm text-gray-400 hover:text-[#14131F]">
          Back to sign in
        </a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we'll send a reset code
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#14131F] text-white py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset code'}
          </button>
        </form>

        <a href="/auth/login" className="text-sm text-gray-400 hover:text-[#14131F] text-center">
          Back to sign in
        </a>
      </div>
    </main>
  )
}