'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { discover, SuggestedUser } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import FollowButton from '@/app/components/follow_button'
import { UserCircle2, Sparkles, Search } from 'lucide-react'

export default function DiscoverPage() {
  const router = useRouter()
  const [people, setPeople] = useState<SuggestedUser[]>([])
  const [filtered, setFiltered] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    discover.getSuggestedPeople()
      .then((res) => {
        setPeople(res.data || [])
        setFiltered(res.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(people)
      return
    }
    setFiltered(
      people.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    )
  }, [search, people])

  if (loading) return <Spinner label="Finding people..." />

  return (
    <main className="max-w-2xl flex flex-col gap-6">

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#E4E1D8] pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#3730A9] bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-10 text-center text-gray-400 text-sm">
          {people.length === 0
            ? 'Book an event to get matched with people who share your interests.'
            : 'No one found matching that name.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((person) => (
            <div
              key={person.id}
              className="border border-[#E4E1D8] bg-white p-4 flex items-center gap-3 hover:bg-[#FAF9F6] transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-[#EEEDFB] flex items-center justify-center overflow-hidden shrink-0">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle2 size={22} className="text-[#3730A9]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{person.name}</p>
                <span className="text-xs text-gray-400 capitalize">{person.role}</span>
                {person.shared_categories && person.shared_categories.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Sparkles size={10} className="text-[#3730A9] shrink-0" />
                    {person.shared_categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] text-[#3730A9] bg-[#EEEDFB] px-1.5 py-0.5"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
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