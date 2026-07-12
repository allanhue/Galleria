'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { events, EventDetail } from '@/app/lib/api'
import Cookies from 'js-cookie'
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle, Share2, Copy, Check, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react'

import Spinner from '@/app/components/spinner'

interface Review {
  id: number
  rating: number
  comment: string
  created_at: string
  user: { name: string; avatar_url?: string }
}

function StarRating({ value, onChange, readonly = false }: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`text-lg ${
            star <= value ? 'text-yellow-400' : 'text-gray-200'
          } ${!readonly ? 'hover:text-yellow-300 transition-colors cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function EventDetailClient() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [booked, setBooked] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasBooked, setHasBooked] = useState(false)
const [likes, setLikes] = useState(0)
const [dislikes, setDislikes] = useState(0)
const [myDirection, setMyDirection] = useState('')
const [saved, setSaved] = useState(false)
const [currentUser, setCurrentUser] = useState<any>(null)


useEffect(() => {
  events.getOne(Number(id))
    .then((res) => setEvent(res.data))
    .catch(console.error)
    .finally(() => setLoading(false))


  events.getLikes(Number(id))
  .then((res) => {
    setLikes(res.data.likes)
    setDislikes(res.data.dislikes)
    setMyDirection(res.data.my_direction)
  })
  .catch(console.error)

// get current user to check if organizer
const stored = Cookies.get('user')
if (stored) {
  try { setCurrentUser(JSON.parse(stored)) } catch {}
}

  // check if user has ever booked this event
  const token = Cookies.get('token')
  if (token) {
    events.getMyBookings()
      .then((res) => {
        const hasThisBooking = res.data.some(
          (b: any) => b.event_id === Number(id) && b.status === 'confirmed'
        )
        setHasBooked(hasThisBooking)
      })
      .catch(console.error)
  }

  // fetch reviews
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}/reviews`)
    .then((r) => r.json())
    .then((data) => {
      setReviews(data.reviews || [])
      setAvgRating(data.avg_rating || 0)
    })
    .catch(console.error)
}, [id])





const handleLike = async (direction: 'like' | 'dislike') => {
  const token = Cookies.get('token')
  if (!token) { router.push('/auth/login'); return }
  try {
    const res = await events.likeEvent(Number(id), direction)
    const updated = await events.getLikes(Number(id))
    setLikes(updated.data.likes)
    setDislikes(updated.data.dislikes)
    setMyDirection(res.data.action === 'removed' ? '' : direction)
  } catch (err) {
    console.error(err)
  }
}

const handleSaveEvent = async () => {
  const token = Cookies.get('token')
  if (!token) { router.push('/auth/login'); return }
  try {
    const res = await events.saveEvent(Number(id))
    setSaved(res.data.saved)
  } catch (err) {
    console.error(err)
  }
}

  const handleBook = async () => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setBooking(true)
    setError('')
    try {
      await events.book(Number(id))
      setBooked(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  const handleShare = async () => {
    if (!event) return

    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.date} at ${event.location}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myRating) return
    setSubmittingReview(true)
    setReviewError('')
    try {
      const token = Cookies.get('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviews([data, ...reviews])
      setReviewSuccess(true)
      setMyRating(0)
      setMyComment('')
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <Spinner label="Loading event..." />

  if (!event) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-500">Event not found.</p>
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to events</span>
        </button>
      </div>

      {/* Event Card */}
      <div className="bg-white border border-[#E4E1D8] overflow-hidden">
        <div className="p-8 flex flex-col gap-6">

          {/* Photos Gallery */}
          {event.photo_urls && event.photo_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {event.photo_urls.map((url, i) => (
                <div key={i} className={`overflow-hidden ${i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#3730A9]" />
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {event.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">
              {event.title}
            </h1>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Event Info Row */}
          <div className="flex flex-wrap gap-6 py-5 border-y border-[#E4E1D8] text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} />
              {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} />
              {event.location}
            </span>
            <span className={`flex items-center gap-1.5 ${event.sold_out ? 'text-red-500 font-medium' : ''}`}>
              <Users size={15} />
              {event.sold_out ? 'Sold out' : `${event.spots_remaining} spots left`}
            </span>
          </div>

          {/* Like / dislike / save row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleLike('like')}
              className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 transition-colors ${
                myDirection === 'like'
                  ? 'border-[#3730A9] bg-[#EEEDFB] text-[#3730A9]'
                  : 'border-[#E4E1D8] text-gray-500 hover:bg-[#FAF9F6]'
              }`}
            >
              <ThumbsUp size={14} />
              <span>{likes}</span>
            </button>

            <button
              onClick={() => handleLike('dislike')}
              className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 transition-colors ${
                myDirection === 'dislike'
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-[#E4E1D8] text-gray-500 hover:bg-[#FAF9F6]'
              }`}
            >
              <ThumbsDown size={14} />
              {currentUser?.id === event.organizer_id && (
                <span>{dislikes}</span>
              )}
            </button>

            <button
              onClick={handleSaveEvent}
              className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 transition-colors ${
                saved
                  ? 'border-[#3730A9] bg-[#EEEDFB] text-[#3730A9]'
                  : 'border-[#E4E1D8] text-gray-500 hover:bg-[#FAF9F6]'
              }`}
            >
              <Bookmark size={14} fill={saved ? '#3730A9' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Booking + Share row */}
          <div className="flex items-center gap-3 flex-wrap pt-2">
            {booked ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-5 py-4 text-sm font-medium">
                <CheckCircle2 size={16} />
                You are booked
              </div>
            ) : event.sold_out ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 px-5 py-4 text-sm font-medium">
                Sold out
              </div>
            ) : (
              <button
                onClick={handleBook}
                disabled={booking}
                className="bg-[#14131F] text-white px-8 py-3 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
              >
                {booking ? 'Booking...' : 'Book my spot'}
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-2 border border-[#E4E1D8] px-4 py-3 text-sm text-gray-500 hover:border-[#3730A9] hover:text-[#3730A9] transition-colors"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Share2 size={15} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* Reviews section */}
          <div className="flex flex-col gap-4 pt-4 border-t border-[#E4E1D8]">
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(avgRating)} readonly />
              <span className="text-sm text-gray-500">
                {avgRating > 0 ? `${avgRating.toFixed(1)} · ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
              </span>
            </div>

{/* Leave a review — visible to anyone who ever booked */}
{hasBooked && !reviewSuccess && (
  <form onSubmit={handleReviewSubmit} className="border border-[#E4E1D8] p-4 flex flex-col gap-3">
    <p className="text-sm font-medium">Leave a review</p>
    <StarRating value={myRating} onChange={setMyRating} />
    <textarea
      placeholder="Share your experience (optional)"
      value={myComment}
      onChange={(e) => setMyComment(e.target.value)}
      rows={3}
      className="border border-[#E4E1D8] px-3 py-2 text-sm outline-none focus:border-[#3730A9] resize-none"
    />
    {reviewError && (
      <p className="text-xs text-red-500">{reviewError}</p>
    )}
    <button
      type="submit"
      disabled={!myRating || submittingReview}
      className="self-start bg-[#14131F] text-white px-5 py-2 text-sm font-medium disabled:opacity-50 hover:bg-[#3730A9] transition-colors"
    >
      {submittingReview ? 'Submitting...' : 'Submit review'}
    </button>
  </form>
)}

            {reviewSuccess && (
              <p className="text-sm text-green-600">Review submitted, thank you!</p>
            )}

            {reviews.length > 0 && (
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1 border-b border-[#E4E1D8] pb-3 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} readonly />
                      <span className="text-xs text-gray-400">{r.user?.name}</span>
                      <span className="text-xs text-gray-300">
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}