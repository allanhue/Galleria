'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { settings, UserSettings } from '@/app/lib/api'
import Cookies from 'js-cookie'
import Spinner from '@/app/components/spinner'
import {
  Bell, Lock, Eye, Palette, User,
  CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react'

type Tab = 'account' | 'notifications' | 'privacy' | 'appearance'

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('account')
  const [prefs, setPrefs] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Account form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) { router.push('/auth/login'); return }

    const stored = Cookies.get('user')
    if (stored) {
      const u = JSON.parse(stored)
      setName(u.name || '')
      setEmail(u.email || '')
    }

    settings.get()
      .then((res) => setPrefs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const showError = (msg: string) => {
    setError(msg)
    setSuccess('')
  }

  const updatePref = async (key: keyof UserSettings, value: any) => {
    if (!prefs) return
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    try {
      await settings.update({ [key]: value })
    } catch (err) {
      console.error(err)
    }
  }

  const saveAccount = async () => {
    setSaving(true)
    try {
      await settings.updateAccount({ name, email })
      const stored = Cookies.get('user')
      if (stored) {
        Cookies.set('user', JSON.stringify({ ...JSON.parse(stored), name, email }), { expires: 7 })
      }
      showSuccess('Account updated')
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    if (!currentPw || !newPw) return
    setSaving(true)
    try {
      await settings.changePassword({ current_password: currentPw, new_password: newPw })
      setCurrentPw('')
      setNewPw('')
      showSuccess('Password changed')
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading settings..." />

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'account',       label: 'Account',       icon: User },
    { key: 'notifications', label: 'Notifications',  icon: Bell },
    { key: 'privacy',       label: 'Privacy',        icon: Eye },
    { key: 'appearance',    label: 'Appearance',     icon: Palette },
  ]

  return (
    <main className="max-w-2xl flex flex-col gap-6">

      {/* Tab row */}
      <div className="flex gap-1 border-b border-[#E4E1D8] overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors -mb-px ${
                tab === t.key
                  ? 'border-[#3730A9] text-[#3730A9] font-medium'
                  : 'border-transparent text-gray-500 hover:text-[#14131F]'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          <CheckCircle2 size={15} />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* ── Account tab ── */}
      {tab === 'account' && (
        <div className="flex flex-col gap-6">
          <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Profile info</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              />
            </div>
            <button
              onClick={saveAccount}
              disabled={saving}
              className="self-start bg-[#14131F] text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">Change password</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9]"
              />
            </div>
            <button
              onClick={savePassword}
              disabled={saving || !currentPw || !newPw}
              className="self-start bg-[#14131F] text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
            >
              Change password
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications tab ── */}
      {tab === 'notifications' && prefs && (
        <div className="border border-[#E4E1D8] bg-white divide-y divide-[#E4E1D8]">
          {[
            { key: 'notify_comments' as keyof UserSettings,  label: 'Comments on my ideas' },
            { key: 'notify_votes'    as keyof UserSettings,  label: 'Votes on my ideas' },
            { key: 'notify_saves'    as keyof UserSettings,  label: 'Someone saves my idea' },
            { key: 'notify_reposts'  as keyof UserSettings,  label: 'Someone reposts my idea' },
            { key: 'notify_follows'  as keyof UserSettings,  label: 'New followers' },
            { key: 'notify_messages' as keyof UserSettings,  label: 'New messages' },
            { key: 'notify_bookings' as keyof UserSettings,  label: 'Booking confirmations' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-700">{item.label}</span>
              <button
                onClick={() => updatePref(item.key, !prefs[item.key])}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  prefs[item.key] ? 'bg-[#3730A9]' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                  prefs[item.key] ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Privacy tab ── */}
      {tab === 'privacy' && prefs && (
        <div className="flex flex-col gap-4">
          <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Who can message me</label>
              <select
                value={prefs.allow_messages}
                onChange={(e) => updatePref('allow_messages', e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] bg-white"
              >
                <option value="everyone">Everyone</option>
                <option value="following">People I follow only</option>
                <option value="none">No one</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Who can follow me</label>
              <select
                value={prefs.allow_follows}
                onChange={(e) => updatePref('allow_follows', e.target.value)}
                className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] bg-white"
              >
                <option value="everyone">Everyone</option>
                <option value="none">No one</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Public profile</p>
                <p className="text-xs text-gray-400 mt-0.5">Others can find and view your profile</p>
              </div>
              <button
                onClick={() => updatePref('profile_visible', !prefs.profile_visible)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  prefs.profile_visible ? 'bg-[#3730A9]' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                  prefs.profile_visible ? 'left-5' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Blocked accounts</p>

            <Link
              href="/settings/blocked"
              className="flex items-center justify-between text-sm text-gray-600 hover:text-[#14131F]"
            >
              <span>Manage blocked accounts</span>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Appearance tab ── */}
      {tab === 'appearance' && prefs && (
        <div className="border border-[#E4E1D8] bg-white p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-2">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => updatePref('theme', t)}
                  className={`flex-1 py-2.5 text-sm border capitalize transition-colors ${
                    prefs.theme === t
                      ? 'border-[#3730A9] bg-[#EEEDFB] text-[#3730A9] font-medium'
                      : 'border-[#E4E1D8] text-gray-500 hover:bg-[#FAF9F6]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Language</label>
            <select
              value={prefs.language}
              onChange={(e) => updatePref('language', e.target.value)}
              className="border border-[#E4E1D8] px-4 py-2.5 text-sm outline-none focus:border-[#3730A9] bg-white"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>
      )}
    </main>
  )
}