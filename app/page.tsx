import Link from 'next/link'

export default function HomePage() {
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
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Browse events
          </Link>
          <Link
            href="/auth/register"
            className="border px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Join Galleria
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: 'Music',       emoji: '🎵' },
            { label: 'Food & Drink',emoji: '🍽️' },
            { label: 'Art',         emoji: '🎨' },
            { label: 'Sports',      emoji: '⚽' },
            { label: 'Networking',  emoji: '🤝' },
            { label: 'Outdoors',    emoji: '🌿' },
            { label: 'Tech',        emoji: '💻' },
            { label: 'Culture',     emoji: '🏛️' },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.label}`}
              className="border rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{cat.emoji}</span>
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