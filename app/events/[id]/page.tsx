import EventDetailClient from './client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const routeParams = await Promise.resolve(params)
  const eventId = routeParams?.id

  if (!eventId) {
    return { title: 'Galleria' }
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return { title: 'Galleria' }
    }

    const event = await res.json()

    return {
      title: `${event.title} — Galleria`,
      description: event.description,
      openGraph: {
        title: event.title,
        description: `${event.date} · ${event.location}`,
        images: event.photo_urls?.[0] ? [{ url: event.photo_urls[0] }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: `${event.date} · ${event.location}`,
        images: event.photo_urls?.[0] ? [event.photo_urls[0]] : [],
      },
    }
  } catch {
    return { title: 'Galleria' }
  }
}

export default function EventDetailPage() {
  return <EventDetailClient />
}