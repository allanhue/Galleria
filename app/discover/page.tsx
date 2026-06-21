'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { discover, SuggestedUser } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import FollowButton from '@/app/components/follow_button'
import { UserCircle2, Sparkles } from 'lucide-react'

export default function DiscoverPeoplePage() {
  const router = useRouter()
  const [people, setPeople] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    discover.getSuggestedPeople()
      .then((res) => setPeople(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Finding people for you..." />

  return (
    <main className="max-w-2xl flex flex-col gap-6">

      {people.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
          No suggestions yet. Book an event or post an idea to get matched with people.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="border border-[#E4E1D8] bg-white p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden shrink-0">
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 size={22} className="text-[#3730A9]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  <span className="text-xs text-gray-400 capitalize">{person.role}</span>
                </div>

                {person.shared_categories && person.shared_categories.length > 0 ? (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Sparkles size={11} className="text-[#3730A9]" />
                    {person.shared_categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-[11px] text-[#3730A9] bg-[#EEEDFB] px-1.5 py-0.5"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Active in the community</p>
                )}
              </div>

              <FollowButton userId={person.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}