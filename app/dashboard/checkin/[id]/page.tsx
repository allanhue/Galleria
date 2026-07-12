'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import api from '@/app/lib/api'
import Spinner from '@/app/components/spinner'
import { CheckCircle2, XCircle, ArrowLeft, Camera } from 'lucide-react'

interface CheckinResult {
  message?: string
  error?: string
  booking?: {
    user: { name: string; email: string }
    event: { title: string }
    checked_in: boolean
  }
}

interface Stats {
  total: number
  checked_in: number
  remaining: number
}

export default function CheckinPage() {
  const { id } = useParams()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const scannerRef = useRef<any>(null)

  const loadStats = () => {
    api.get(`/events/${id}/checkin`)
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/auth/login'); return }
    loadStats()
  }, [id])

  const handleCheckin = async (token: string) => {
    try {
      const res = await api.post('/checkin', { token })
      setResult({ message: res.data.message, booking: res.data.booking })
      loadStats()
    } catch (err: any) {
      setResult({ error: err.response?.data?.error || 'Check-in failed' })
    }
  }

  const startScanner = async () => {
    setScanning(true)
    setResult(null)
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          await scanner.stop()
          setScanning(false)
          await handleCheckin(decodedText)
        },
        () => {}
      )
    } catch (err) {
      console.error(err)
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
    }
    setScanning(false)
  }

  if (loading) return <Spinner label="Loading check-in..." />

  return (
    <main className="max-w-md flex flex-col gap-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#14131F] w-fit"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </button>

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-6 border border-[#E4E1D8] bg-white p-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-semibold">{stats.checked_in}</span>
            <span className="text-xs text-gray-400">Checked in</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-semibold">{stats.remaining}</span>
            <span className="text-xs text-gray-400">Remaining</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-semibold">{stats.total}</span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="flex-1 h-1.5 bg-[#FAF9F6] overflow-hidden">
            <div
              className="h-full bg-[#3730A9]"
              style={{ width: `${stats.total > 0 ? (stats.checked_in / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Scanner */}
      <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
        <div id="qr-reader" className={scanning ? 'block' : 'hidden'} />

        {!scanning ? (
          <button
            onClick={startScanner}
            className="flex items-center justify-center gap-2 bg-[#14131F] text-white py-3 text-sm font-medium hover:bg-[#3730A9] transition-colors"
          >
            <Camera size={16} />
            Scan QR code
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="text-sm border border-[#E4E1D8] py-2.5 text-gray-500 hover:bg-[#FAF9F6] transition-colors"
          >
            Stop scanning
          </button>
        )}
      </div>

      {/* Manual entry fallback */}
      <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Manual entry</p>
        <div className="flex gap-2">
          <input
            placeholder="Paste QR token..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="flex-1 border border-[#E4E1D8] px-3 py-2 text-sm outline-none focus:border-[#3730A9] font-mono"
          />
          <button
            onClick={() => { handleCheckin(manualToken); setManualToken('') }}
            disabled={!manualToken}
            className="bg-[#14131F] text-white px-4 py-2 text-sm disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
          >
            Check in
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`border p-4 flex items-start gap-3 ${
          result.error
            ? 'border-red-200 bg-red-50'
            : 'border-green-200 bg-green-50'
        }`}>
          {result.error ? (
            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${result.error ? 'text-red-700' : 'text-green-700'}`}>
              {result.error || result.message}
            </p>
            {result.booking && (
              <p className="text-xs text-gray-500 mt-1">
                {result.booking.user.name} · {result.booking.user.email}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}