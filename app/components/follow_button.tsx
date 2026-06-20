'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { follow } from '@/app/lib/api'
import Cookies from 'js-cookie'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'

export default function FollowButton({ userId }: { userId: number }) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) return
    follow.getStatus(userId)
      .then((res) => setIsFollowing(res.data.is_following))
      .catch(console.error)
      .finally(() => setChecked(true))
  }, [userId])

  const handleClick = async () => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    try {
      if (isFollowing) {
        await follow.unfollowUser(userId)
        setIsFollowing(false)
      } else {
        await follow.followUser(userId)
        setIsFollowing(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!checked) return null

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'border-[#E4E1D8] text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'border-[#3730A9] text-[#3730A9] bg-[#EEEDFB] hover:bg-[#3730A9] hover:text-white'
      }`}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isFollowing ? (
        <UserCheck size={12} />
      ) : (
        <UserPlus size={12} />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}