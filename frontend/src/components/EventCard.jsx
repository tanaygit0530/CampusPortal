import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEvents } from '../context/EventContext'
import { useAuth } from '../context/AuthContext'
import RegistrationModal from './RegistrationModal'

const accent = {
  amber: 'bg-amber text-ink',
  rust: 'bg-rust text-paper',
  ink: 'bg-ink text-amber',
}

export default function EventCard({ event }) {
  const { isEventRegistered, highlightedEventId } = useEvents()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const eventId = event._id || event.id
  const totalSeats = event.totalSeats || event.seatsTotal || 0
  const seatsLeft = event.seatsLeft !== undefined ? event.seatsLeft : totalSeats
  const isFull = seatsLeft <= 0
  const isClosed = event.status === 'closed'
  const isDeadlinePassed =
    event.registrationDeadline && new Date() > new Date(event.registrationDeadline)

  const isHighlighted =
    highlightedEventId && (highlightedEventId === eventId || highlightedEventId === event.id)

  const registered = isEventRegistered(eventId)
  const pctLeft = totalSeats > 0 ? Math.round((seatsLeft / totalSeats) * 100) : 0
  const low = pctLeft <= 15

  const handleButtonClick = (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (registered) {
      navigate('/profile')
      return
    }

    if (user?.role === 'admin') {
      navigate(`/admin/events/${eventId}/registrants`)
      return
    }

    setIsModalOpen(true)
  }

  // Determine button label and style
  let buttonText = 'Register'
  let buttonDisabled = false

  if (!isAuthenticated) {
    buttonText = 'Log in to register'
  } else if (user?.role === 'admin') {
    buttonText = 'View registrants'
  } else if (registered) {
    buttonText = '✓ Registered'
  } else if (isFull) {
    buttonText = 'Seats full'
    buttonDisabled = true
  } else if (isClosed || isDeadlinePassed) {
    buttonText = 'Registration closed'
    buttonDisabled = true
  }

  return (
    <>
      <div
        className={`group relative flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md ${
          isHighlighted
            ? 'border-amber ring-2 ring-amber bg-amber/5 scale-[1.01] shadow-lg'
            : 'border-ink/10'
        }`}
      >
        {/* Stub label strip */}
        <div className={`flex w-16 shrink-0 items-center justify-center ${accent[event.color] || accent.amber}`}>
          <span className="rotate-180 font-mono text-[11px] uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
            {event.category || 'General'}
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
          <Link to={`/events/${eventId}`} className="block group-hover:text-rust transition-colors">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-ink group-hover:text-rust transition-colors">
                {event.title}
              </h3>
              <span className="shrink-0 font-mono text-[10px] text-slate">
                {event.mode === 'online' ? '🌐 Online' : event.mode === 'hybrid' ? '⚡ Hybrid' : '🏛️ On-Campus'}
              </span>
            </div>
            {event.tagline && (
              <p className="mt-1 text-xs text-slate line-clamp-1">{event.tagline}</p>
            )}
            <p className="mt-1.5 font-mono text-[12px] text-slate">
              {event.date} · {event.time || '10:00 AM'} · {event.venue}
            </p>
          </Link>

          <div>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-slate">
              <span
                className={`transition-colors duration-500 ${
                  isHighlighted ? 'text-rust font-bold bg-amber/20 px-1 rounded animate-pulse' : ''
                }`}
              >
                {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left
              </span>
              <span>{totalSeats} total</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  low ? 'bg-rust' : 'bg-amber'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pctLeft))}%` }}
              />
            </div>

            <button
              onClick={handleButtonClick}
              disabled={buttonDisabled}
              className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                registered
                  ? 'bg-paper-dim text-ink hover:bg-paper-dim/70'
                  : 'bg-ink text-paper hover:bg-ink-light'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {buttonText}
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
