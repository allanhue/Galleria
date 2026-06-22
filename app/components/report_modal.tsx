'use client'
import { useState } from 'react'
import { report } from '@/app/lib/api'
import { X, Flag, CheckCircle2 } from 'lucide-react'

const reasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Something else' },
]

interface Props {
  targetType: 'user' | 'post' | 'comment' | 'event'
  targetId: number
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      await report.create({ target_type: targetType, target_id: targetId, reason, details })
      setSubmitted(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white border border-[#E4E1D8] w-full max-w-sm p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 size={28} className="text-green-600" />
            <p className="text-sm text-gray-600">Report submitted. Our team will review it.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Flag size={14} className="text-red-500" />
                Report
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-[#14131F]">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {reasons.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`text-left text-sm px-3 py-2 border transition-colors ${
                    reason === r.value
                      ? 'border-[#3730A9] bg-[#EEEDFB] text-[#3730A9] font-medium'
                      : 'border-[#E4E1D8] text-gray-600 hover:bg-[#FAF9F6]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="border border-[#E4E1D8] px-3 py-2 text-sm outline-none focus:border-[#3730A9] resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="bg-[#14131F] text-white py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}