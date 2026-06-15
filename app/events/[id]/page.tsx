import EventDetailClient from './client'

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://galleria-b1yq.onrender.com'}/events`
    )
    const data = await res.json()
    const eventList = data.events || []
    return eventList.map((event: { id: number }) => ({
      id: String(event.id),
    }))
  } catch {
    return []
  }
}

export default function EventDetailPage() {
  return <EventDetailClient />
}