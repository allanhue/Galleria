'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { community, CommunityPost } from '@/app/lib/api'
import Cookies from 'js-cookie'

export default function CommunityPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [form, setForm] = useState({ title: '', body: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    community.getPosts()
      .then((res) => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await community.createPost(form)
      setPosts([res.data, ...posts])
      setForm({ title: '', body: '' })
      setSuccess('Idea posted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (id: number, direction: 'up' | 'down') => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    try {
      await community.vote(id, direction)
      setPosts(posts.map((p) =>
        p.id === id
          ? { ...p, votes: direction === 'up' ? p.votes + 1 : p.votes - 1 }
          : p
      ))
    } catch (err: any) {
      console.error(err.response?.data?.error)
    }
  }

  return (
    <main className="max-w-2xl flex flex-col gap-8">

      <div>
        <h1 className="text-2xl font-semibold">Community</h1>
        <p className="text-sm text-gray-500 mt-1">
          Suggest ideas, vote on what happens next in your city
        </p>
      </div>

      {/* Post form */}
      <form
        onSubmit={handleSubmit}
        className="border rounded-xl p-5 flex flex-col gap-4"
      >
        <h2 className="text-base font-medium">Suggest an event idea</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Title</label>
          <input
            placeholder="e.g. Sunset hike at Ngong Hills"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Describe your idea</label>
          <textarea
            placeholder="What would this event look like? Where, when, who for?"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black resize-none"
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="self-end bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post idea'}
        </button>
      </form>

      {/* Posts list */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-medium">
          Community ideas {posts.length > 0 && `(${posts.length})`}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading ideas...</p>
        ) : posts.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-gray-400 text-sm">
            No ideas yet. Be the first to suggest one!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium text-base">{post.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {post.body}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleVote(post.id, 'up')}
                  className="flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  ▲ <span className="font-medium">{post.votes}</span>
                </button>
                <button
                  onClick={() => handleVote(post.id, 'down')}
                  className="text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-400"
                >
                  ▽
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(post.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}