'use client'
import { useState } from 'react'
import { block } from '@/app/lib/api'
import { ShieldOff, Loader2 } from 'lucide-react'

export default function BlockButton({ userId, onBlocked }: { userId: number; onBlocked?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const handleBlock = async () => {
    if (!confirm('Block this user? They will no longer be able to follow, message, or interact with you.')) return
    setLoading(true)
    try {
      await block.blockUser(userId)
      setBlocked(true)
      onBlocked?.()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to block')
    } finally {
      setLoading(false)
    }
  }

  if (blocked) {
    return <span className="text-xs text-gray-400">Blocked</span>
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#E4E1D8] text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
      Block
    </button>
  )
}