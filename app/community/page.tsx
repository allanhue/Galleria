'use client'
import { useEffect, useState } from 'react'
import { community, CommunityPost } from '@/lib/api'

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [form, setForm] = useState({ title: '', body: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    community.getPosts()
      .then((res) => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await community.createPost(form)
      setPosts([res.data, ...posts])
      setForm({ title: '', body: '' })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post')
    }
  }

  const handleVote = async (id: number, direction: 'up' | 'down') => {
    try {
      await community.vote(id, direction)
      setPosts(posts.map((p) =>
        p.id === id
          ? { ...p, votes: direction === 'up' ? p.votes + 1 : p.votes - 1 }
          : p
      ))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="max-w-2xl flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Community</h1>

      {/* Post idea form */}
      <form onSubmit={handleSubmit} className="border rounded-xl p-5 flex flex-col gap-3">
        <h2 className="text-base font-medium">Suggest an event idea</h2>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2"
          required
        />
        <textarea
          placeholder="Describe your idea..."
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 resize-none"
          rows={3}
          required
        />
        <button
          type="submit"
          className="self-end bg-black text-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          Post idea
        </button>
      </form>

      {/* Posts list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading posts...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <div key={post.id} className="border rounded-xl p-5 flex flex-col gap-2">
              <h3 className="font-medium text-base">{post.title}</h3>
              <p className="text-sm text-gray-500">{post.body}</p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => handleVote(post.id, 'up')}
                  className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  ▲ {post.votes}
                </button>
                <button
                  onClick={() => handleVote(post.id, 'down')}
                  className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  ▽
                </button>
                <span className="text-xs text-gray-400">{post.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}