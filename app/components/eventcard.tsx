'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Event, events } from '@/app/lib/api'

interface Props {
  event: Event
}

export default function EventCard({ event }: Props) {
  const handleBook = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      await events.book(event.id)
      alert('Spot booked!')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Booking failed')
    }
  }

  return (
    <article className="group overflow-hidden border border-[#E4E1D8] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(20,19,31,0.08)]">
      <Link href={`/events/${event.id}`} className="block">
        {event.photo_urls && event.photo_urls.length > 0 ? (
          <div className="aspect-video overflow-hidden bg-[#FAF9F6]">
            <img
              src={event.photo_urls[0]}
              alt={event.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-video bg-[#EEEDFB] p-4">
            <div className="flex h-full items-center justify-center border border-[#D9D6F5] bg-white/45">
              <Ticket size={28} className="text-[#3730A9]" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-base font-medium leading-snug text-[#14131F]">
              {event.title}
            </h3>
            <span className="shrink-0 bg-[#EEEDFB] px-2 py-1 text-[11px] font-medium text-[#3730A9]">
              {event.category}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <CalendarDays size={14} className="text-gray-400" />
              <span className="line-clamp-1">{event.date}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="line-clamp-1">{event.location}</span>
            </p>
          </div>
        </div>
      </Link>

      <button
        onClick={handleBook}
        className="mx-4 mb-4 flex items-center justify-center gap-2 bg-[#14131F] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3730A9]"
      >
        <Ticket size={15} />
        Book spot
      </button>
    </article>
  )
}
