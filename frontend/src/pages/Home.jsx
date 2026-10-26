import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import EventCardSkeleton from '../components/EventCardSkeleton'
import { useEvents } from '../context/EventContext'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { events, stats, loading, error, refetch } = useEvents()
  const { user, isAuthenticated } = useAuth()

  // Real statistics directly from /api/stats (Zero dummy data)
  const displayStats = [
    {
      label: 'Open Events',
      value: stats?.openEvents !== undefined ? String(stats.openEvents).padStart(2, '0') : '00',
    },
    {
      label: 'Confirmed Registrations',
      value: stats?.totalRegistrations !== undefined ? String(stats.totalRegistrations) : '0',
    },
    {
      label: 'Seats Filled',
      value: stats?.seatsFilled !== undefined ? `${stats.seatsFilled}` : '0',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-28">
        <div className="grid gap-10 md:gap-12 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <span className="font-mono text-xs sm:text-[13px] uppercase tracking-[0.2em] text-rust font-semibold">
              Academic Year 2026–27
            </span>
            <h1 className="mt-3 sm:mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] tracking-tight text-ink">
              Where campus
              <br />
              shows up.
            </h1>
            <p className="mt-4 sm:mt-6 max-w-md font-body text-sm sm:text-base leading-relaxed text-slate">
              One portal to browse every fest, seminar, match and workshop on campus — with instant,
              real-time digital passes.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to={isAuthenticated && user?.role === 'admin' ? '/admin' : '/dashboard'}
                className="w-full sm:w-auto text-center rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light shadow-sm"
              >
                {isAuthenticated && user?.role === 'admin' ? 'Admin Dashboard' : 'Browse events'}
              </Link>
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center rounded-full border border-ink/20 px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                >
                  Log in / Sign up
                </Link>
              ) : (
                user?.role === 'student' && (
                  <Link
                    to="/profile"
                    className="w-full sm:w-auto text-center rounded-full border border-ink/20 px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                  >
                    My Pass Profile
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 border-t border-ink/10 pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            {displayStats.map((s) => (
              <div key={s.label} className="md:col-span-3">
                <p className="font-display text-2xl sm:text-3xl font-semibold text-ink transition-all duration-300">
                  {s.value}
                </p>
                <p className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-slate">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events section */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Upcoming on campus</h2>
          {!loading && !error && (
            <span className="font-mono text-[12px] text-slate">
              {events.filter((e) => e.status === 'open').length} events open
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rust/30 bg-rust/5 px-5 py-4">
            <p className="text-sm text-rust">{error}</p>
            <button
              onClick={refetch}
              className="rounded-full bg-rust px-4 py-1.5 text-xs font-semibold text-paper hover:bg-rust/90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-paper/50 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              No events yet. Check back soon.
            </h3>
            <p className="mt-1 text-sm text-slate">
              When administrators publish campus events, they will appear here in real-time.
            </p>
            {user?.role === 'admin' && (
              <div className="mt-6">
                <Link
                  to="/admin"
                  className="rounded-full bg-ink px-5 py-2.5 font-body text-xs font-semibold text-paper hover:bg-ink-light"
                >
                  Create your first event
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e._id || e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
