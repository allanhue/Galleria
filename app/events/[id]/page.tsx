import EventDetailClient from './client'

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${params.id}`,
      { cache: 'no-store' }
    )
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