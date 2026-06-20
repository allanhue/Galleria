'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { messages, Message } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import { ArrowLeft, Send } from 'lucide-react'

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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
  }, [])

  const load = () => {
    messages.getMessages(Number(id))
      .then((res) => setItems(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 7000) // poll every 7s
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setDraft('')
    try {
      const res = await messages.send(Number(id), body)
      setItems([...items, res.data])
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Spinner label="Loading conversation..." />

  return (
    <main className="max-w-2xl flex flex-col h-[calc(100vh-140px)]">
      <button
        onClick={() => router.push('/messages')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#14131F] mb-4 w-fit"
      >
        <ArrowLeft size={14} />
        Back to messages
      </button>

      <div className="flex-1 overflow-y-auto border border-[#E4E1D8] bg-white p-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center my-auto">
            No messages yet. Say hello.
          </p>
        ) : (
          items.map((m) => {
            const isMine = m.sender_id === currentUserId
            return (
              <div
                key={m.id}
                className={`max-w-[75%] px-3 py-2 text-sm ${
                  isMine
                    ? 'self-end bg-[#14131F] text-white'
                    : 'self-start bg-[#FAF9F6] text-gray-700'
                }`}
              >
                {m.body}
                <div className={`text-[10px] mt-1 ${isMine ? 'text-gray-300' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="bg-[#14131F] text-white p-2.5 disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </main>
  )
}