import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import EventCardSkeleton from '../components/EventCardSkeleton'
import useFetchEvents from '../hooks/useFetchEvents'

const stats = [
  { label: 'Live events', value: '04' },
  { label: 'Students registered', value: '1,240+' },
  { label: 'Departments hosting', value: '09' },
]

export default function Home() {
  // useEffect-backed custom hook — fetches on mount, exposes loading/error/data
  const { events, loading, error, refetch } = useFetchEvents()

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-rust">
              Academic Year 2026–27
            </span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
              Where campus
              <br />
              shows up.
            </h1>
            <p className="mt-6 max-w-md font-body text-base leading-relaxed text-slate">
              One portal to browse every fest, seminar, match and workshop on campus — and a
              digital stub to prove you've got a seat.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
              >
                Browse events
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-ink/20 px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                Admin log in
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-ink/10 pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            {stats.map((s) => (
              <div key={s.label} className="md:col-span-3">
                <p className="font-display text-3xl font-semibold text-ink">{s.value}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events — driven by useFetchEvents (loading / error / data) */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Upcoming on campus</h2>
          {!loading && !error && (
            <span className="font-mono text-[12px] text-slate">{events.length} events open</span>
          )}
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
            : events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  )
}
