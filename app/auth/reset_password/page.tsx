'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import api from '@/app/lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', code: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', form)
      router.push('/auth/login?reset=success')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the code from your email and your new password
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">6-digit reset code</label>
            <input
              placeholder="123456"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] tracking-widest"
              maxLength={6}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#14131F] text-white py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <a href="/auth/login" className="text-sm text-gray-400 hover:text-[#14131F] text-center">
          Back to sign in
        </a>
      </div>
    </main>
  )
}