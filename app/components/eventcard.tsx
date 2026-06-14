import Link from 'next/link'
import { Event, events } from '@/lib/api'

interface Props {
  event: Event
}

export default function EventCard({ event }: Props) {
  const handleBook = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await events.book(event.id)
      alert('Spot booked!')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Booking failed')
    }
  }

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-2">
      <Link href={`/events/${event.id}`}>
        <h3 className="font-medium text-base">{event.title}</h3>
        <p className="text-sm text-gray-500">{event.date}</p>
        <p className="text-sm text-gray-500">{event.location}</p>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
          {event.category}
        </span>
      </Link>
      <button
        onClick={handleBook}
        className="mt-2 bg-black text-white text-sm py-2 rounded-lg"
      >
        Book spot
      </button>
    </div>
  )
}