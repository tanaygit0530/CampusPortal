import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import EventCardSkeleton from '../components/EventCardSkeleton'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../context/EventContext'

const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Other']
const modes = ['All', 'on-campus', 'online', 'hybrid']
const statusFilters = ['All', 'open', 'closed']

export default function Dashboard() {
  const { user } = useAuth()
  const { events, loading, error, refetch, registrations, cancelRegistration } = useEvents()

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMode, setSelectedMode] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('asc') // asc = soonest first

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        // Title search
        if (
          searchQuery.trim() &&
          !e.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
          !e.tagline?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ) {
          return false
        }
        // Category filter
        if (selectedCategory !== 'All' && e.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false
        }
        // Mode filter
        if (selectedMode !== 'All' && e.mode?.toLowerCase() !== selectedMode.toLowerCase()) {
          return false
        }
        // Status filter
        if (selectedStatus !== 'All' && e.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
  }, [events, searchQuery, selectedCategory, selectedMode, selectedStatus, sortOrder])

  // Active confirmed registrations for this student
  const activeRegistrations = registrations.filter((r) => r.status === 'confirmed')

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelRegistration(cancelTarget.regId)
      setCancelTarget(null)
    } catch (err) {
      console.error('Failed to cancel registration:', err)
    } finally {
      setCancelling(false)
    }
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-rust font-semibold">
            {user?.role === 'admin' ? 'Admin portal' : 'Student portal'}
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Hi, {firstName} 👋
          </h1>
          <p className="mt-1 font-body text-sm text-slate">
            Browse and reserve your official pass for upcoming campus events.
          </p>
        </div>
        <div className="flex gap-6 border-t border-ink/10 pt-4 md:border-t-0 md:pt-0">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              {activeRegistrations.length}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
              Active Passes
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              {loading ? '—' : events.filter((e) => e.status === 'open').length}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
              Events Open
            </p>
          </div>
        </div>
      </div>

      {/* My Registrations Section (for Students) */}
      {user?.role === 'student' && (
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">My Registered Passes</h2>
            <Link
              to="/profile"
              className="font-mono text-xs font-semibold text-rust hover:underline"
            >
              View Full Profile →
            </Link>
          </div>

          {activeRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-paper/60 p-6 text-center">
              <p className="font-body text-sm text-slate">
                You haven't registered for any events yet. Pick an event below to reserve your pass!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeRegistrations.map((reg) => {
                const eventObj = reg.event || {}
                const eventTitle = eventObj.title || 'Campus Event'
                const eventDate = eventObj.date || 'TBD'
                const eventVenue = eventObj.venue || 'Campus'
                const regId = reg._id || reg.id

                return (
                  <div
                    key={regId}
                    className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Confirmed
                        </span>
                        <span className="font-mono text-[10px] text-slate">Pass #{regId.slice(-6)}</span>
                      </div>
                      <h3 className="mt-2.5 font-display text-base font-semibold text-ink line-clamp-1">
                        {eventTitle}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-slate">
                        📅 {eventDate} · 📍 {eventVenue}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                      <Link
                        to={`/events/${eventObj._id || eventObj.id}`}
                        className="text-xs font-semibold text-ink hover:text-rust"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() =>
                          setCancelTarget({
                            regId,
                            title: eventTitle,
                          })
                        }
                        className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] font-semibold text-rust hover:bg-rust hover:text-paper transition-colors cursor-pointer"
                      >
                        Cancel Pass
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Browse Events Section */}
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Browse Events</h2>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search events by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/15 bg-white px-4 py-2 pl-9 text-xs outline-none focus:border-rust"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Filter Pills and Controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate mr-1">
              Category:
            </span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`rounded-full px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-ink text-paper'
                    : 'border border-ink/15 bg-white text-slate hover:border-ink hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-slate">Mode:</span>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-rust capitalize"
              >
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-slate">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-rust capitalize"
              >
                {statusFilters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Sort Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center gap-1 rounded-lg border border-ink/15 bg-white px-2.5 py-1 font-mono text-xs text-slate hover:text-ink cursor-pointer"
            >
              <span>Date</span>
              <span>{sortOrder === 'asc' ? '↑ Soonest' : '↓ Latest'}</span>
            </button>
          </div>
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
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-paper/50 p-12 text-center">
            <h3 className="font-display text-lg font-semibold text-ink">
              {events.length === 0
                ? 'No events yet. Check back soon.'
                : 'No events match your selected filters.'}
            </h3>
            <p className="mt-1 text-sm text-slate">
              {events.length === 0
                ? 'When administrators create events, they will be listed here live.'
                : 'Try clearing your search query or adjusting your category/status filters.'}
            </p>
            {events.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                  setSelectedMode('All')
                  setSelectedStatus('All')
                }}
                className="mt-4 rounded-full border border-ink/20 px-4 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-ink/5 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredEvents.map((e) => (
              <EventCard key={e._id || e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Cancellation */}
      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        title="Cancel Event Pass"
        message={`Are you sure you want to cancel your pass for "${cancelTarget?.title}"? Your seat will immediately become available for other students.`}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
        confirmText={cancelling ? 'Cancelling...' : 'Yes, Cancel Pass'}
        cancelText="Keep My Pass"
      />
    </div>
  )
}
