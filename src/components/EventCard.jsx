import { useState } from 'react'

const accent = {
  amber: 'bg-amber text-ink',
  rust: 'bg-rust text-paper',
  ink: 'bg-ink text-amber',
}

export default function EventCard({ event }) {
  const [registered, setRegistered] = useState(false)
  const pctLeft = Math.round((event.seatsLeft / event.seatsTotal) * 100)
  const low = pctLeft <= 15

  return (
    <div className="flex overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Stub label strip */}
      <div className={`flex w-16 shrink-0 items-center justify-center ${accent[event.color]}`}>
        <span className="rotate-180 font-mono text-[11px] uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
          {event.category}
        </span>
      </div>

      {/* Perforated divider */}
      <div className="relative">
        <div className="dashed-divider h-full" />
        <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-paper" />
        <span className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-paper" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl font-semibold text-ink">{event.title}</h3>
            <span className="shrink-0 font-mono text-[11px] text-slate">{event.id}</span>
          </div>
          <p className="mt-1 font-mono text-[13px] text-slate">
            {event.date} · {event.time} · {event.venue}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-slate">
            <span>{event.seatsLeft} seats left</span>
            <span>{event.seatsTotal} total</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
            <div
              className={`h-full rounded-full ${low ? 'bg-rust' : 'bg-amber'}`}
              style={{ width: `${pctLeft}%` }}
            />
          </div>

          <button
            onClick={() => setRegistered(!registered)}
            disabled={event.seatsLeft === 0}
            className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition-colors ${
              registered
                ? 'bg-paper-dim text-ink hover:bg-paper-dim/70'
                : 'bg-ink text-paper hover:bg-ink-light'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {event.seatsLeft === 0 ? 'Seats full' : registered ? '✓ Registered' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
