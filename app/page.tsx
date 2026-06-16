import Link from 'next/link'
import {
  Music,
  UtensilsCrossed,
  Palette,
  Footprints,
  Handshake,
  Leaf,
  Code,
  Building2,
} from 'lucide-react'

export default function HomePage() {
  const categories = [
    { label: 'Music', Icon: Music },
    { label: 'Food & Drink', Icon: UtensilsCrossed },
    { label: 'Art', Icon: Palette },
    { label: 'Sports', Icon: Footprints },
    { label: 'Networking', Icon: Handshake },
    { label: 'Outdoors', Icon: Leaf },
    { label: 'Tech', Icon: Code },
    { label: 'Culture', Icon: Building2 },
  ]

  return (
    <main className="flex flex-col gap-10">

      {/* Hero */}
      <section className="flex flex-col gap-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          Discover events.<br />Connect with people.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl">
          Find events happening around you, book your spot, and shape
          what happens next with your community.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/events"
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse events
          </Link>
          <Link
            href="/auth/register"
            className="border px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Join Galleria
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.label}`}
              className="border rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <cat.Icon className="w-6 h-6 text-gray-700" />
              <span className="text-sm font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Community CTA */}
      <section className="border rounded-xl p-6 flex flex-col gap-3 bg-gray-50">
        <h2 className="text-lg font-medium">Have an idea for an event?</h2>
        <p className="text-sm text-gray-500">
          Post it to the community. Let people vote, comment and make it happen.
        </p>
        <Link
          href="/community"
          className="self-start border bg-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          Go to community
        </Link>
      </section>

    </main>
  )
}