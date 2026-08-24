import { useState } from 'react'
import EventCard from '../components/EventCard'
import EventCardSkeleton from '../components/EventCardSkeleton'
import useFetchEvents from '../hooks/useFetchEvents'
import useWindowSize from '../hooks/useWindowSize'
import { myRegistrations } from '../data/events'

const categories = ['All', 'Technical', 'Cultural', 'Sports']

export default function Dashboard() {
  const [filter, setFilter] = useState('All')
  const { events, loading, error, refetch } = useFetchEvents()
  const { width } = useWindowSize() // custom hook from CH-3 pattern, re-runs on resize

  const filtered =
    filter === 'All' ? events : events.filter((e) => e.category === filter)

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-rust">
            Student dashboard
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Hi, Ananya 👋
          </h1>
          <p className="mt-1 font-mono text-[11px] text-slate">
            Viewing on {width < 768 ? 'mobile' : 'desktop'} · {width}px wide
          </p>
        </div>
        <div className="flex gap-6 border-t border-ink/10 pt-4 md:border-t-0 md:pt-0">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              {myRegistrations.length}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
              Registrations
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              {loading ? '—' : events.length}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
              Events open
            </p>
          </div>
        </div>
      </div>

      {/* My registrations strip */}
      <div className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">My registrations</h2>
        <div className="flex flex-wrap gap-4">
          {myRegistrations.map((reg) => {
            const event = events.find((e) => e.id === reg.id)
            if (!event) return null
            return (
              <div
                key={reg.id}
                className="flex min-w-[220px] items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-sm"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    reg.status === 'Confirmed' ? 'bg-amber' : 'bg-slate'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{event.title}</p>
                  <p className="font-mono text-[11px] text-slate">
                    {reg.regNo} · {reg.status}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Browse events — useFetchEvents drives loading / error / data */}
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-ink">Browse events</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-4 py-1.5 font-mono text-[12px] uppercase tracking-wider transition-colors ${
                  filter === c
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 text-slate hover:border-ink hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rust/30 bg-rust/5 px-5 py-4">
            <p className="text-sm text-rust">{error}</p>
            <button
              onClick={refetch}
              className="rounded-full bg-rust px-4 py-1.5 text-xs font-semibold text-paper hover:bg-rust/90"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            : filtered.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </div>
    </div>
  )
}
