'use client'
import { useEffect, useState, useRef } from 'react'
import { notifications, Notification } from '@/app/lib/api'
import Cookies from 'js-cookie'
import { Bell, MessageCircle, ChevronUp, Bookmark, Repeat2, CalendarCheck, X } from 'lucide-react'


const iconMap: Record<string, any> = {
  comment: MessageCircle,
  vote: ChevronUp,
  save: Bookmark,
  repost: Repeat2,
  booking: CalendarCheck,
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = () => {
    const token = Cookies.get('token')
    if (!token) return
    notifications.getAll()
      .then((res) => {
        setItems(res.data.notifications || [])
        setUnread(res.data.unread_count || 0)
      })
      .catch(console.error)
  }

const handleDismiss = async (e: React.MouseEvent, id: number) => {
  e.stopPropagation()
  try {
    await notifications.dismiss(id)
    setItems(items.filter((n) => n.id !== id))
  } catch (err) {
    console.error(err)
  }
}

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unread > 0) {
      try {
        await notifications.markRead()
        setUnread(0)
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative text-gray-500 hover:text-[#14131F] transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#3730A9] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 max-h-96 overflow-y-auto bg-white border border-[#E4E1D8] shadow-lg z-20">
          <div className="px-4 py-3 border-b border-[#E4E1D8]">
            <span className="text-sm font-medium">Notifications</span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
          ) : (
            items.map((n) => {
              const Icon = iconMap[n.type] || Bell
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#E4E1D8] last:border-b-0 group ${
                    !n.read ? 'bg-[#FAF9F6]' : ''
                  }`}
                >
                  <Icon size={15} className="text-[#3730A9] mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(e, n.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}