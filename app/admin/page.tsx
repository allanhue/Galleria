'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { report, Report } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewed:  'bg-blue-50 text-blue-700 border-blue-200',
  actioned:  'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function AdminPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = Cookies.get('user')
    if (!stored) { router.push('/auth/login'); return }
    const user = JSON.parse(stored)
    if (user.role !== 'system_admin') { router.push('/'); return }

    report.getAll()
      .then((res) => setReports(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await report.updateStatus(id, status)
      setReports(reports.map((r) => r.id === id ? { ...r, status } : r))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <Spinner label="Loading reports..." />

  return (
    <main className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Admin</p>
          <h1 className="text-xl font-semibold tracking-tight">Reports queue</h1>
        </div>
        <span className="text-xs bg-[#14131F] text-white px-3 py-1">
          {reports.filter(r => r.status === 'pending').length} pending
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="border border-[#E4E1D8] bg-white p-8 text-center text-gray-400 text-sm">
          No reports yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="border border-[#E4E1D8] bg-white p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase text-gray-500">
                      {r.target_type}
                    </span>
                    <span className="text-xs text-gray-400">#{r.target_id}</span>
                  </div>
                  <p className="text-sm font-medium">{r.reason.replace('_', ' ')}</p>
                  {r.details && (
                    <p className="text-sm text-gray-500">{r.details}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    by {r.reporter?.name} · {new Date(r.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 border shrink-0 ${statusColors[r.status] || ''}`}>
                  {r.status}
                </span>
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  {['reviewed', 'actioned', 'dismissed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(r.id, s)}
                      className="text-xs border border-[#E4E1D8] px-3 py-1.5 hover:bg-[#FAF9F6] transition-colors capitalize"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}