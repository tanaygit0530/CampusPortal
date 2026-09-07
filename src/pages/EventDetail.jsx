import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../context/EventContext'
import RegistrationModal from '../components/RegistrationModal'

export default function EventDetail() {
  const { id } = useParams()
  const { events, isEventRegistered } = useEvents()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const event = events.find((e) => e.id === id)
  const isRegistered = event ? isEventRegistered(event.id) : false

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink">Event not found</h2>
        <p className="mt-2 text-sm text-slate">The event you are looking for does not exist or has been removed.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-ink-light"
        >
          ← Back to events
        </Link>
      </div>
    )
  }

  const pctLeft = Math.round((event.seatsLeft / event.seatsTotal) * 100)
  const low = pctLeft <= 15

  const rulesList = event.rules
    ? event.rules.split('\n').filter((r) => r.trim().length > 0)
    : ['Follow standard campus guidelines.', 'Carry valid student ID card.']

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate transition-colors hover:text-ink"
      >
        ← Back to events
      </Link>

      {toastMessage && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-amber/20 px-5 py-3 border border-amber/40 text-ink">
          <p className="text-sm font-semibold">✓ {toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-xs font-bold text-ink">
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-lg">
        {/* Banner Header Image / Gradient Fallback */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-ink">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="h-full w-full object-cover opacity-85 transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-ink via-rust/70 to-amber/80 p-8 text-paper">
              <span className="font-display text-4xl font-semibold">{event.title}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-paper">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber px-3 py-1 font-mono text-xs font-semibold uppercase text-ink">
                  {event.category}
                </span>
                <span className="rounded-full bg-paper/20 px-3 py-1 font-mono text-xs font-semibold uppercase text-paper backdrop-blur-sm">
                  {event.mode || 'On-campus'}
                </span>
                <span className="rounded-full bg-rust px-3 py-1 font-mono text-xs font-semibold uppercase text-paper">
                  {event.isTeamEvent ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-paper leading-tight">
                {event.title}
              </h1>
              <p className="mt-1 font-mono text-xs sm:text-sm text-paper/80">{event.tagline}</p>
            </div>

            <span className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
              {event.id}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Key Quick Info Strip */}
          <div className="grid gap-4 rounded-2xl border border-ink/10 bg-paper-dim/40 p-5 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Date & Time</p>
              <p className="mt-1 font-display text-base font-semibold text-ink">{event.date}</p>
              <p className="text-xs text-slate">{event.time}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Venue</p>
              <p className="mt-1 font-display text-base font-semibold text-ink">{event.venue}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Deadline</p>
              <p className="mt-1 font-display text-base font-semibold text-rust">
                {event.registrationDeadline || event.date}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Eligibility</p>
              <p className="mt-1 font-display text-base font-semibold text-ink">
                {event.eligibility || 'Open to all'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate border-b border-ink/10 pb-2">
              Event Overview
            </h3>
            <p className="mt-3 text-base leading-relaxed text-ink/90 font-body whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Prizes Callout Box (if available) */}
          {event.prizes && (
            <div className="rounded-2xl border border-amber/50 bg-amber/10 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber font-display text-xl text-ink">
                  🏆
                </span>
                <div>
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                    Prizes & Rewards
                  </h4>
                  <p className="mt-1 font-display text-xl font-semibold text-ink">{event.prizes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rules & Guidelines */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate border-b border-ink/10 pb-2">
              Rules & Guidelines
            </h3>
            <ul className="mt-3 space-y-2">
              {rulesList.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-ink/90">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rust" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Person */}
          {(event.contactName || event.contactEmail) && (
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                Event Organizer & Query Contact
              </h4>
              <p className="mt-1 font-display text-base font-semibold text-ink">
                {event.contactName || 'Campus Event Coordinator'}
              </p>
              <p className="font-mono text-xs text-rust">{event.contactEmail || 'events@college.edu'}</p>
            </div>
          )}

          {/* Seat Capacity Bar & Register Button */}
          <div className="space-y-4 pt-4 border-t border-ink/10">
            <div className="flex items-center justify-between font-mono text-xs text-slate">
              <span>Seat Reservation Status</span>
              <span>
                {event.seatsLeft} / {event.seatsTotal} Total Seats Available
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
              <div
                className={`h-full rounded-full transition-all duration-300 ${low ? 'bg-rust' : 'bg-amber'}`}
                style={{ width: `${pctLeft}%` }}
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isRegistered || event.seatsLeft === 0}
              className={`w-full rounded-full py-4 text-base font-semibold transition-colors ${
                isRegistered
                  ? 'bg-paper-dim text-ink opacity-80 cursor-default'
                  : event.seatsLeft === 0
                    ? 'bg-ink/40 text-paper cursor-not-allowed'
                    : 'bg-ink text-paper hover:bg-ink-light'
              }`}
            >
              {event.seatsLeft === 0
                ? 'Seats Full'
                : isRegistered
                  ? '✓ Already Registered'
                  : 'Register for this Event'}
            </button>
          </div>
        </div>
      </div>

      {/* Unstop Registration Modal */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  )
}
