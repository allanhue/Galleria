'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { events, EventDetail } from '@/app/lib/api'
import { uploadImage } from '@/app/lib/upload'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import { ImagePlus, X, Loader2 } from 'lucide-react'

const categories = [
  'Music', 'Food & Drink', 'Art',
  'Sports', 'Networking', 'Tech', 'Culture', 'Outdoors'
]

export default function EditEventPage() {
  const { id } = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', date: '', location: '',
    city: '', country: '', category: 'Music', capacity: 100,
  })
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    events.getOne(Number(id))
      .then((res) => {
        const e = res.data
        setForm({
          title: e.title, description: e.description, date: e.date,
          location: e.location, city: e.city || '', country: e.country || '',
          category: e.category, capacity: e.capacity,
        })
        setPhotos(e.photo_urls || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos per event')
      return
    }
    setUploading(true)
    setError('')
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)))
      setPhotos([...photos, ...urls])
    } catch {
      setError('Photo upload failed, try again')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (url: string) => {
    setPhotos(photos.filter((p) => p !== url))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (photos.length < 2) {
      setError('Please keep at least 2 photos')
      return
    }
    setSaving(true)
    setError('')
    try {
      await events.update(Number(id), { ...form, photo_urls: photos })
      router.push(`/events/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading event..." />

  return (
    <main className="max-w-xl flex flex-col gap-8">
      <div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-[#14131F]">
          ← Back to dashboard
        </a>
        <h1 className="text-2xl font-semibold mt-3 tracking-tight">Edit event</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Event photos <span className="text-gray-400 font-normal">(min 2, max 5)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <div key={url} className="relative aspect-square border border-[#E4E1D8]">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square border border-dashed border-[#E4E1D8] flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#3730A9] hover:text-[#3730A9] transition-colors"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <ImagePlus size={18} />
                    <span className="text-xs">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Event title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] resize-none"
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
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
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
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Location / venue</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-[#14131F] text-white py-3 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors mt-2"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}