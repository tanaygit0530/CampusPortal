import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../context/EventContext'
import { useAuth } from '../context/AuthContext'
import RegistrationModal from './RegistrationModal'

const accent = {
  amber: 'bg-amber text-ink',
  rust: 'bg-rust text-paper',
  ink: 'bg-ink text-amber',
}

export default function EventCard({ event }) {
  const { registerForEvent, cancelRegistration, isEventRegistered } = useEvents()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const registered = isEventRegistered(event.id, user?.email)
  const pctLeft = Math.round((event.seatsLeft / event.seatsTotal) * 100)
  const low = pctLeft <= 15

  const handleButtonClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (registered) {
      cancelRegistration(event.id)
    } else {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div className="group relative flex overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        {/* Stub label strip */}
        <div className={`flex w-16 shrink-0 items-center justify-center ${accent[event.color] || accent.amber}`}>
          <span className="rotate-180 font-mono text-[11px] uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
            {event.category}
          </span>
        </div>

        {/* Perforated divider */}
        <div className="relative">
          <div className="dashed-divider h-full" />
          <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-paper border border-ink/5" />
          <span className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-paper border border-ink/5" />
        </div>

        {/* Main content - Wrapped in Link for detail view */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <Link to={`/events/${event.id}`} className="block group-hover:text-rust transition-colors">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-ink group-hover:text-rust transition-colors">
                {event.title}
              </h3>
              <span className="shrink-0 font-mono text-[11px] text-slate">{event.id}</span>
            </div>
            {event.tagline && (
              <p className="mt-1 text-xs text-slate line-clamp-1">{event.tagline}</p>
            )}
            <p className="mt-1.5 font-mono text-[12px] text-slate">
              {event.date} · {event.time} · {event.venue}
            </p>
          </Link>

          <div>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-slate">
              <span>{event.seatsLeft} seats left</span>
              <span>{event.seatsTotal} total</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
              <div
                className={`h-full rounded-full transition-all ${low ? 'bg-rust' : 'bg-amber'}`}
                style={{ width: `${pctLeft}%` }}
              />
            </div>

            <button
              onClick={handleButtonClick}
              disabled={!registered && event.seatsLeft === 0}
              className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition-colors ${
                registered
                  ? 'bg-paper-dim text-ink hover:bg-paper-dim/70'
                  : 'bg-ink text-paper hover:bg-ink-light'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {!registered && event.seatsLeft === 0
                ? 'Seats full'
                : registered
                  ? '✓ Registered'
                  : 'Register'}
            </button>
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />
    </>
  )
}
