import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../../context/EventContext'
import ConfirmModal from '../../components/ConfirmModal'

export default function EventRegistrants() {
  const { id } = useParams()
  const { events, eventRegistrants, cancelStudentRegistration } = useEvents()
  const [removeTarget, setRemoveTarget] = useState(null)

  const event = events.find((e) => e.id === id)
  const registrants = eventRegistrants.filter((r) => r.eventId === id)

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink">Event not found</h2>
        <Link
          to="/admin"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>
    )
  }

  const handleConfirmRemove = () => {
    if (removeTarget) {
      cancelStudentRegistration(event.id, removeTarget.studentEmail)
      setRemoveTarget(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate transition-colors hover:text-ink"
      >
        ← Back to Admin Dashboard
      </Link>

      {/* Event Banner */}
      <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-rust font-semibold">
              {event.category} · {event.id}
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{event.title}</h1>
            <p className="mt-1 font-mono text-xs text-slate">
              {event.date} · {event.time} · {event.venue}
            </p>
          </div>

          <div className="text-right">
            <p className="font-display text-3xl font-semibold text-ink">
              {registrants.length} <span className="text-base font-normal text-slate">/ {event.seatsTotal}</span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Registered Headcount</p>
          </div>
        </div>
      </div>

      {/* Registrants Table */}
      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Student Registrations & Submissions</h2>
          <span className="font-mono text-xs text-slate">{registrants.length} students</span>
        </div>

        {registrants.length === 0 ? (
          <p className="font-mono text-sm text-slate py-8 text-center">No students registered for this event yet.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden lg:table">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wider text-slate">
                  <th className="pb-3 pr-4">Student Name</th>
                  <th className="pb-3 px-4">Email & Phone</th>
                  <th className="pb-3 px-4">Dept / Year</th>
                  <th className="pb-3 px-4">Team Name</th>
                  <th className="pb-3 px-4">Registered Date</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-sm">
                {registrants.map((r, i) => (
                  <tr key={i} className="hover:bg-paper/50">
                    <td className="py-4 pr-4 font-semibold text-ink">{r.studentName}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate">
                      <div>{r.studentEmail}</div>
                      <div className="text-[11px] text-slate/70">{r.phone || '9876543210'}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate">
                      {r.department || 'CS'} · {r.year || '3rd'} Yr
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-rust font-semibold">
                      {r.teamName || 'N/A'}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate">{r.registeredAt}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                          r.status === 'Confirmed' ? 'bg-amber/20 text-ink' : 'bg-slate/20 text-slate'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(r)}
                        className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust transition-colors hover:bg-rust hover:text-paper"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile / Compact Stacked View */}
            <div className="space-y-4 lg:hidden">
              {registrants.map((r, i) => (
                <div key={i} className="rounded-xl border border-ink/10 bg-paper-dim/30 p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-ink">{r.studentName}</h3>
                      <p className="font-mono text-[11px] text-slate">{r.studentEmail} · {r.phone || '9876543210'}</p>
                    </div>
                    <span className="rounded-full bg-amber/20 px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold text-ink">
                      {r.status}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate">
                    <span>Dept: {r.department || 'CS'} ({r.year || '3rd'} Yr)</span>
                    {r.teamName && r.teamName !== 'N/A' && (
                      <span className="block text-rust font-semibold">Team: {r.teamName}</span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-ink/10 flex justify-between items-center">
                    <span className="font-mono text-[11px] text-slate">{r.registeredAt}</span>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(r)}
                      className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        title="Remove Student Registration"
        message={`Are you sure you want to remove ${removeTarget?.studentName} (${removeTarget?.studentEmail}) from this event? This will increase available seats by 1.`}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
        confirmText="Yes, Remove Student"
        cancelText="Cancel"
      />
    </div>
  )
}
