'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages, follow, Conversation, User } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import Spinner from '@/app/components/spinner'
import { UserCircle2 } from 'lucide-react'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [following, setFollowing] = useState<User[]>([])
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

    Promise.all([
      messages.getConversations(),
      follow.getFollowing(),
    ])
      .then(([convoRes, followRes]) => {
        setConversations(convoRes.data || [])
        setFollowing(followRes.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStartChat = async (userId: number) => {
    try {
      const res = await messages.start(userId)
      router.push(`/messages/${res.data.id}`)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not start conversation')
    }
  }

  if (loading) return <Spinner label="Loading messages..." />

  // people you follow who you don't already have a conversation with
  const conversationPartnerIds = new Set(
    conversations.map((c) => (c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id))
  )
  const newPeople = following.filter((u) => !conversationPartnerIds.has(u.id))

  return (
    <main className="max-w-2xl flex flex-col gap-8">

      {newPeople.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Start a conversation
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {newPeople.map((person) => (
              <button
                key={person.id}
                onClick={() => handleStartChat(person.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-[#3730A9] transition-all">
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 size={22} className="text-[#3730A9]" />
                  )}
                </div>
                <span className="text-xs text-gray-600 truncate w-full text-center">
                  {person.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Conversations
        </h2>

        {conversations.length === 0 ? (
          <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
            {following.length === 0
              ? 'Follow someone to start messaging.'
              : 'No conversations yet. Tap someone above to say hello.'}
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
      </div>
    </main>
  )
}