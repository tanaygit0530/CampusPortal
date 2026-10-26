import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../context/EventContext'
import ConfirmModal from '../components/ConfirmModal'

export default function Profile() {
  const { user } = useAuth()
  const { registrations, events, cancelRegistration } = useEvents()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Student's registrations
  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const cancelled = registrations.filter((r) => r.status === 'cancelled')

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelRegistration(cancelTarget.regId)
      setCancelTarget(null)
    } catch (err) {
      console.error('Failed to cancel pass:', err)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Profile Header */}
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink font-display text-2xl font-bold text-paper">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-rust font-semibold">
                Student Account
              </span>
              <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
                {user?.name || 'Student User'}
              </h1>
              <p className="font-mono text-xs text-slate">{user?.email || 'No email registered'}</p>
            </div>
          </div>

          <div className="flex gap-4 border-t border-ink/10 pt-4 sm:border-t-0 sm:pt-0">
            <div className="rounded-2xl bg-paper-dim/40 px-4 py-2.5 text-center">
              <p className="font-display text-2xl font-semibold text-ink">{confirmed.length}</p>
              <p className="font-mono text-[10px] uppercase text-slate">Active Passes</p>
            </div>
            <div className="rounded-2xl bg-paper-dim/40 px-4 py-2.5 text-center">
              <p className="font-display text-2xl font-semibold text-ink">{cancelled.length}</p>
              <p className="font-mono text-[10px] uppercase text-slate">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">My Event Passes</h2>
          <Link
            to="/dashboard"
            className="font-mono text-xs font-semibold text-rust hover:underline"
          >
            + Browse More Events
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-paper/50 p-12 text-center">
            <h3 className="font-display text-lg font-semibold text-ink">
              No event registrations yet
            </h3>
            <p className="mt-1 text-sm text-slate">
              Explore the campus calendar and claim your pass for upcoming fests, competitions, and seminars.
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard"
                className="rounded-full bg-ink px-6 py-2.5 font-body text-xs font-semibold text-paper hover:bg-ink-light"
              >
                Browse Events Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const regId = reg._id || reg.id
              const eventObj = reg.event || {}
              const eventTitle = eventObj.title || 'Campus Event'
              const isConfirmed = reg.status === 'confirmed'

              return (
                <div
                  key={regId}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        isConfirmed ? 'bg-amber' : 'bg-slate/40'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-ink">
                          {eventTitle}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                            isConfirmed ? 'bg-amber/20 text-ink' : 'bg-slate/20 text-slate'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate">
                        📅 {eventObj.date || 'TBD'} · 📍 {eventObj.venue || 'Campus'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-slate/80">
                        <span>Pass #{regId.slice(-6)}</span>
                        {reg.teamName && (
                          <span className="font-semibold text-rust">Team: {reg.teamName}</span>
                        )}
                        <span>Dept: {reg.department || 'General'}</span>
                        <span>Year: {reg.year || '1st'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Link
                      to={`/events/${eventObj._id || eventObj.id}`}
                      className="rounded-full border border-ink/15 px-4 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-ink/5"
                    >
                      View Event
                    </Link>
                    {isConfirmed && (
                      <button
                        onClick={() =>
                          setCancelTarget({
                            regId,
                            title: eventTitle,
                          })
                        }
                        className="rounded-full border border-rust/30 px-4 py-1.5 font-mono text-xs font-semibold text-rust hover:bg-rust hover:text-paper transition-colors cursor-pointer"
                      >
                        Cancel Pass
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        title="Cancel Event Pass"
        message={`Are you sure you want to cancel your pass for "${cancelTarget?.title}"? This frees up 1 seat on the server immediately.`}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
        confirmText={cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
        cancelText="Keep My Pass"
      />
    </div>
  )
}
