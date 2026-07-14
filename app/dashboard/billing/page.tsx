'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { payments, OrganizerPlan, Payment } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import { CheckCircle2, Zap } from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<OrganizerPlan | null>(null)
  const [history, setHistory] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/auth/login'); return }

    Promise.all([
      payments.getPlan(),
      payments.getMyPayments(),
    ])
      .then(([planRes, histRes]) => {
        setPlan(planRes.data)
        setHistory(histRes.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (planName: string) => {
    setSubscribing(true)
    try {
      const res = await payments.subscribe(planName)
      window.location.href = res.data.authorization_url
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initiate subscription')
      setSubscribing(false)
    }
  }

  if (loading) return <Spinner label="Loading billing..." />

  const isPro = plan?.plan === 'pro'

  return (
    <main className="max-w-2xl flex flex-col gap-8">

      {/* Current plan */}
      <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Current plan</p>
            <p className="text-xl font-semibold tracking-tight mt-1 capitalize">
              {plan?.plan || 'Free'}
            </p>
            {isPro && plan?.current_period_end && (
              <p className="text-xs text-gray-400 mt-1">
                Renews {new Date(plan.current_period_end).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </div>
          {isPro && (
            <span className="flex items-center gap-1.5 text-xs bg-[#3730A9] text-white px-3 py-1.5">
              <Zap size={12} />
              Pro
            </span>
          )}
        </div>
      </div>

      {/* Plans */}
      {!isPro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: 'pro_monthly',
              label: 'Pro Monthly',
              price: 'KES 1,999',
              period: 'per month',
              features: [
                'Unlimited events',
                'Priority listing',
                'Advanced analytics',
                'Verified organizer badge',
                'Email support',
              ]
            },
            {
              name: 'pro_yearly',
              label: 'Pro Yearly',
              price: 'KES 19,990',
              period: 'per year',
              badge: 'Save 17%',
              features: [
                'Everything in monthly',
                'Two months free',
                'Priority support',
                'Custom event URL',
              ]
            },
          ].map((p) => (
            <div
              key={p.name}
              className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{p.label}</p>
                  {p.badge && (
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold tracking-tight mt-1">{p.price}</p>
                <p className="text-xs text-gray-400">{p.period}</p>
              </div>

              <ul className="flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={14} className="text-[#3730A9] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.name)}
                disabled={subscribing}
                className="bg-[#14131F] text-white py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors mt-auto"
              >
                {subscribing ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Free plan limits */}
      {!isPro && (
        <div className="border border-[#E4E1D8] bg-[#FAF9F6] p-4 text-sm text-gray-500">
          Free plan includes up to 3 events. Upgrade to Pro for unlimited events and premium features.
        </div>
      )}

      {/* Payment history */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wide text-gray-400">Payment history</p>
        {history.length === 0 ? (
          <div className="border border-[#E4E1D8] bg-white p-6 text-center text-gray-400 text-sm">
            No payments yet.
          </div>
        ) : (
          <div className="border border-[#E4E1D8] bg-white divide-y divide-[#E4E1D8]">
            {history.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium capitalize">{payment.type}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    KES {(payment.amount / 100).toLocaleString()}
                  </p>
                  <span className={`text-xs ${
                    payment.status === 'success' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}