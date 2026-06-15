'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { events } from '@/app/lib/api'
import Cookies from 'js-cookie'

const categories = [
  'Music', 'Food & Drink', 'Art',
  'Sports', 'Networking', 'Tech', 'Culture', 'Outdoors'
]

export default function CreateEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'Music',
    capacity: 100,
    image_url: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await events.create(form)
      router.push(`/events/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl flex flex-col gap-8">
      <div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-black">
          ← Back to dashboard
        </a>
        <h1 className="text-2xl font-semibold mt-3">Create event</h1>
        <p className="text-sm text-gray-500 mt-1">
          Post your event to the Galleria community
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Event title</label>
          <input
            placeholder="e.g. Nairobi Jazz Night"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            placeholder="Tell people what this event is about..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black resize-none"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Location</label>
          <input
            placeholder="e.g. The Alchemist, Westlands"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Image URL{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            placeholder="https://..."
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-3 rounded-lg text-sm font-medium disabled:opacity-50 mt-2"
        >
          {loading ? 'Publishing...' : 'Publish event'}
        </button>
      </form>
    </main>
  )
}