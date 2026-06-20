'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages, Conversation } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import Spinner from '@/app/components/spinner'
import { MessageSquare, UserCircle2 } from 'lucide-react'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    const stored = Cookies.get('user')
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (stored) {
      try { setCurrentUserId(JSON.parse(stored).id) } catch {}
    }

    messages.getConversations()
      .then((res) => setConversations(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Loading messages..." />

  return (
    <main className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conversations with people you follow
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
          No conversations yet. Follow someone to start messaging.
        </div>
      ) : (
        <div className="flex flex-col border border-[#E4E1D8] bg-white">
          {conversations.map((convo) => {
            const other = convo.user_a_id === currentUserId ? convo.user_b : convo.user_a
            return (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#E4E1D8] last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden shrink-0">
                  {other.avatar_url ? (
                    <img src={other.avatar_url} alt={other.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 size={20} className="text-[#3730A9]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{other.name}</p>
                    {convo.unread_count > 0 && (
                      <span className="bg-[#3730A9] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                        {convo.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {convo.last_message?.body || 'No messages yet'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}