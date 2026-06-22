'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { community, CommunityPost, messages, PostComment } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import {
  ChevronUp, ChevronDown, MessageCircle, Bookmark,
  Repeat2, Send, AlertCircle, CheckCircle2, Trash2,MessageSquare, MoreVertical, Flag
} from 'lucide-react'
import FollowButton from '@/app/components/follow_button'
import ReportModal from '@/app/components/report_modal'

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CommunityPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [form, setForm] = useState({ title: '', body: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openComments, setOpenComments] = useState<number | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'user'; id: number } | null>(null)
const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
const handleStartChat = async (userId: number) => {
const token = Cookies.get('token')
  if (!token) {
    router.push('/auth/login')
    return
  }
  try {
    const res = await messages.start(userId)
    router.push(`/messages/${res.data.id}`)
  } catch (err: any) {
    alert(err.response?.data?.error || 'Follow this user first to message them')
  }
}

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      await community.deleteComment(commentId)
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, comments: (p.comments || []).filter((c) => c.id !== commentId) }
          : p
      ))
    } catch (err) {
      console.error(err)
    }
  }
const handleDeletePost = async (postId: number) => {
  if (!confirm('Delete this idea permanently?')) return
  try {
    await community.deletePost(postId)
    setPosts(posts.filter((p) => p.id !== postId))
  } catch (err) {
    console.error(err)
  }
}



  useEffect(() => {
    community.getPosts()
      .then((res) => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const requireAuth = () => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requireAuth()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await community.createPost(form)
      setPosts([res.data, ...posts])
      setForm({ title: '', body: '' })
      setSuccess('Idea posted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (id: number, direction: 'up' | 'down') => {
    if (!requireAuth()) return
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

  const toggleComments = async (postId: number) => {
    if (openComments === postId) {
      setOpenComments(null)
      return
    }
    setOpenComments(postId)
    try {
      const res = await community.getComments(postId)
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, comments: res.data } : p
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const submitComment = async (postId: number) => {
    if (!requireAuth()) return
    const body = commentDrafts[postId]?.trim()
    if (!body) return
    try {
      const res = await community.addComment(postId, body)
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), res.data] }
          : p
      ))
      setCommentDrafts({ ...commentDrafts, [postId]: '' })
    } catch (err) {
      console.error(err)
    }
  }

  
  const handleSave = async (postId: number) => {
    if (!requireAuth()) return
    try {
      const res = await community.toggleSave(postId)
      const newSet = new Set(savedIds)
      if (res.data.saved) newSet.add(postId)
      else newSet.delete(postId)
      setSavedIds(newSet)
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, saves: res.data.saved ? p.saves + 1 : p.saves - 1 }
          : p
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const handleRepost = async (postId: number) => {
    if (!requireAuth()) return
    try {
      await community.repost(postId)
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, reposts: p.reposts + 1 } : p
      ))
    } catch (err: any) {
      console.error(err.response?.data?.error)
    }
  }

useEffect(() => {
  const stored = Cookies.get('user')
  if (stored) {
    try {
      const u = JSON.parse(stored)
      setCurrentUserId(u.id)
    } catch {}
  }
}, [])

  return (
    <main className="max-w-2xl flex flex-col gap-8">

      <div>
        <p className="text-sm text-gray-500 mt-1">
          Suggest ideas, vote, comment and shape what happens next
        </p>
      </div>

      {/* Post form */}
      <form
        onSubmit={handleSubmit}
        className="border border-[#E4E1D8] p-5 flex flex-col gap-4 bg-white"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Suggest an event idea
        </h2>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
            <CheckCircle2 size={15} />
            {success}
          </div>
        )}

        <input
          placeholder="e.g. Sunset hike at Ngong Hills"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
          required
        />

        <textarea
          placeholder="What would this event look like? Where, when, who for?"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] resize-none"
          rows={3}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="self-end bg-[#14131F] text-white px-6 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
        >
          {submitting ? 'Posting...' : 'Post idea'}
        </button>
      </form>

      {/* Posts list */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Ideas {posts.length > 0 && `(${posts.length})`}
        </h2>

        {loading ? (
          <Spinner label="Loading ideas..." />
        ) : posts.length === 0 ? (
          <div className="border border-[#E4E1D8] p-8 text-center text-gray-400 text-sm bg-white">
            No ideas yet. Be the first to suggest one.
          </div>
        ) : (
          posts.map((post) => {
            const isSaved = savedIds.has(post.id)
            const commentsOpen = openComments === post.id

            return (
              <div key={post.id} className="border border-[#E4E1D8] bg-white flex flex-col">
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="font-medium text-base">{post.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-1">
                      {post.body}
                    </p>
               {post.user && (
  <div className="flex items-center gap-2 mt-2">
    <p className="text-xs text-gray-400">by {post.user.name}</p>
    {currentUserId !== post.user_id && (
      <FollowButton userId={post.user_id} />
    )}
  </div>
)}
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    {/* Vote */}
                    <div className="flex items-center border border-[#E4E1D8]">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className="p-1.5 hover:bg-[#FAF9F6] text-gray-500"
                        aria-label="Upvote"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <span className="text-sm font-medium px-1.5 min-w-[24px] text-center">
                        {post.votes}
                      </span>
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className="p-1.5 hover:bg-[#FAF9F6] text-gray-500"
                        aria-label="Downvote"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    {/* Comment toggle */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] text-gray-500"
                    >
                      <MessageCircle size={14} />
                      {post.comments?.length || ''}
                    </button>

                    {/* Save */}
                    <button
                      onClick={() => handleSave(post.id)}
                      className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 transition-colors ${
                        isSaved
                          ? 'border-[#3730A9] text-[#3730A9] bg-[#EEEDFB]'
                          : 'border-[#E4E1D8] text-gray-500 hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <Bookmark size={14} fill={isSaved ? '#3730A9' : 'none'} />
                      {post.saves || ''}
                    </button>

                    {/* Repost */}
                    <button
                      onClick={() => handleRepost(post.id)}
                      className="flex items-center gap-1.5 text-sm border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] text-gray-500"
                    >
                      <Repeat2 size={14} />
                      {post.reposts || ''}
                    </button>
                    
                    {currentUserId === post.user_id && (
  <button
    onClick={() => handleDeletePost(post.id)}
    className="flex items-center gap-1.5 text-sm border border-[#E4E1D8] px-3 py-1.5 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
  >
    <Trash2 size={14} />
  </button>
)}

                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(post.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                </div>
                
<div className="relative ml-auto">
  <button
    onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
    className="text-gray-400 hover:text-[#14131F] p-1"
  >
    <MoreVertical size={14} />
  </button>
  {openMenu === post.id && (
    <div className="absolute right-0 top-7 bg-white border border-[#E4E1D8] shadow-md z-10 w-36">
      <button
        onClick={() => {
          setReportTarget({ type: 'post', id: post.id })
          setOpenMenu(null)
        }}
        className="w-full text-left text-xs px-3 py-2 flex items-center gap-2 text-gray-600 hover:bg-[#FAF9F6]"
      >
        <Flag size={12} />
        Report post
      </button>
    </div>
  )}
</div>
                {/* Comments thread */}
                {commentsOpen && (
                  <div className="border-t border-[#E4E1D8] bg-[#FAF9F6] p-4 flex flex-col gap-3">
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((c) => (
                        <div key={c.id} className="flex items-start justify-between gap-2 group">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">
                                {c.user?.name || 'User'}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {timeAgo(c.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{c.body}</p>
                          </div>

                          {currentUserId === c.user_id && (
                            <button
                              onClick={() => handleDeleteComment(post.id, c.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No comments yet.</p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        placeholder="Add a comment..."
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) =>
                          setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitComment(post.id)
                        }}
                        className="flex-1 border border-[#E4E1D8] px-3 py-2 text-sm outline-none focus:border-[#3730A9] bg-white"
                      />
                      <button
                        onClick={() => submitComment(post.id)}
                        className="p-2 bg-[#14131F] text-white hover:bg-[#3730A9] transition-colors"
                        aria-label="Send comment"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      {reportTarget && (
  <ReportModal
    targetType={reportTarget.type}
    targetId={reportTarget.id}
    onClose={() => setReportTarget(null)}
  />
)}
    </main>
  )
}