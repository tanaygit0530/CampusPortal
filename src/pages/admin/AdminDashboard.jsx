import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../../context/EventContext'
import ConfirmModal from '../../components/ConfirmModal'

export default function AdminDashboard() {
  const { events, deleteEvent, eventRegistrants } = useEvents()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const totalEvents = events.length
  const totalRegistrations = eventRegistrants.length

  const totalSeats = events.reduce((sum, e) => sum + (e.seatsTotal || 0), 0)
  const seatsLeft = events.reduce((sum, e) => sum + (e.seatsLeft || 0), 0)
  const seatsFilled = totalSeats - seatsLeft
  const seatsFilledPct = totalSeats > 0 ? Math.round((seatsFilled / totalSeats) * 100) : 0

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header & Create Button */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-rust">
            Administrator Portal
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Admin Dashboard
          </h1>
          <p className="mt-1 font-mono text-[12px] text-slate">
            Manage campus events, capacity, and student registrations
          </p>
        </div>

        <Link
          to="/admin/events/new"
          className="rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
        >
          + Create New Event
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-12 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Total Events</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{totalEvents}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Total Registrations</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{totalRegistrations}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Seats Filled</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {seatsFilledPct}% <span className="text-xs font-normal text-slate">({seatsFilled}/{totalSeats})</span>
          </p>
        </div>
      </div>

      {/* Events Table / Card List */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">All Campus Events</h2>
          <span className="font-mono text-xs text-slate">{events.length} listed</span>
        </div>

        {events.length === 0 ? (
          <p className="font-mono text-sm text-slate py-8 text-center">No events found. Click "+ Create New Event" to add one.</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wider text-slate">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Date & Time</th>
                  <th className="pb-3 px-4">Seats (Left/Total)</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-sm">
                {events.map((e) => {
                  const filled = e.seatsTotal - e.seatsLeft
                  return (
                    <tr key={e.id} className="hover:bg-paper/50">
                      <td className="py-4 pr-4 font-semibold text-ink">
                        <Link to={`/events/${e.id}`} className="hover:text-rust transition-colors">
                          {e.title}
                        </Link>
                        <span className="block font-mono text-[11px] text-slate font-normal">{e.id}</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">{e.category}</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">
                        {e.date} · {e.time}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-ink">
                        {e.seatsLeft} / {e.seatsTotal} left ({filled} filled)
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                            e.status === 'open' && e.seatsLeft > 0
                              ? 'bg-amber/20 text-ink'
                              : 'bg-rust/20 text-rust'
                          }`}
                        >
                          {e.seatsLeft > 0 ? e.status : 'closed'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <Link
                          to={`/admin/events/${e.id}/registrants`}
                          className="inline-block rounded-full border border-ink/20 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                        >
                          Registrants
                        </Link>
                        <Link
                          to={`/admin/events/${e.id}/edit`}
                          className="inline-block rounded-full border border-amber px-3 py-1 font-mono text-[11px] uppercase font-semibold text-ink transition-colors hover:bg-amber"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(e)}
                          className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust transition-colors hover:bg-rust hover:text-paper"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile Stacked Card View */}
            <div className="space-y-4 md:hidden">
              {events.map((e) => (
                <div key={e.id} className="rounded-xl border border-ink/10 bg-paper-dim/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-ink">{e.title}</h3>
                      <p className="font-mono text-[11px] text-slate">{e.id} · {e.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                        e.seatsLeft > 0 ? 'bg-amber/20 text-ink' : 'bg-rust/20 text-rust'
                      }`}
                    >
                      {e.seatsLeft > 0 ? e.status : 'closed'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate">
                    {e.date} · {e.time} · {e.venue}
                  </p>
                  <p className="font-mono text-xs text-ink">
                    Seats: {e.seatsLeft} / {e.seatsTotal} left
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-ink/10">
                    <Link
                      to={`/admin/events/${e.id}/registrants`}
                      className="flex-1 text-center rounded-full border border-ink/20 py-1.5 font-mono text-[11px] uppercase font-semibold text-ink"
                    >
                      Registrants
                    </Link>
                    <Link
                      to={`/admin/events/${e.id}/edit`}
                      className="flex-1 text-center rounded-full border border-amber py-1.5 font-mono text-[11px] uppercase font-semibold text-ink"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(e)}
                      className="flex-1 text-center rounded-full border border-rust/30 py-1.5 font-mono text-[11px] uppercase font-semibold text-rust"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All existing registrations for this event will also be removed.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Yes, Delete Event"
        cancelText="Cancel"
      />
    </div>
  )
}
