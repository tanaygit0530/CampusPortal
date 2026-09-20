import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../../context/EventContext'
import useForm from '../../hooks/useForm'
import ConfirmModal from '../../components/ConfirmModal'
import EventCard from '../../components/EventCard'

const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar']

function validateQuickEvent(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Title is required'
  if (!values.category) errors.category = 'Category is required'
  if (!values.date.trim()) errors.date = 'Date is required'
  if (!values.time.trim()) errors.time = 'Time is required'
  if (!values.venue.trim()) errors.venue = 'Venue is required'
  if (!values.totalSeats) {
    errors.totalSeats = 'Total seats is required'
  } else if (isNaN(values.totalSeats) || Number(values.totalSeats) <= 0) {
    errors.totalSeats = 'Seats must be a positive number'
  }
  return errors
}

export default function AdminDashboard() {
  const { events, createEvent, deleteEvent, eventRegistrants } = useEvents()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  const { values, errors, submitting, handleChange, handleSubmit, reset } = useForm(
    {
      title: '',
      category: 'Technical',
      date: '',
      time: '',
      venue: '',
      totalSeats: '',
    },
    validateQuickEvent
  )

  const onQuickSubmit = async (formValues) => {
    try {
      const created = createEvent(formValues)
      setSuccessBanner(`Event "${created.title}" created successfully!`)
      reset()
      setTimeout(() => setSuccessBanner(null), 4000)
    } catch {
      // handled
    }
  }

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
          + Full Event Builder
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-10 grid gap-5 sm:grid-cols-3">
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

      {/* Quick Event Creation Form */}
      <div className="mb-12 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-ink">Quick Create Event</h2>
        <p className="mt-1 text-xs text-slate font-mono">
          Submit this form to call createEvent() from Context and instantly update the live list below without reload.
        </p>

        {successBanner && (
          <div className="mt-4 rounded-xl bg-amber/20 px-4 py-2.5 text-sm font-semibold text-ink border border-amber/40">
            ✓ {successBanner}
          </div>
        )}

        <form onSubmit={handleSubmit(onQuickSubmit)} className="mt-6 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="e.g. AI Innovation Summit"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-rust ${
                  errors.title ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-rust">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Category *
              </label>
              <select
                name="category"
                value={values.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-rust"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Date *
              </label>
              <input
                type="text"
                name="date"
                value={values.date}
                onChange={handleChange}
                placeholder="Nov 15, 2026"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-rust ${
                  errors.date ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.date && <p className="mt-1 text-xs text-rust">{errors.date}</p>}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Time *
              </label>
              <input
                type="text"
                name="time"
                value={values.time}
                onChange={handleChange}
                placeholder="10:00 AM"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-rust ${
                  errors.time ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.time && <p className="mt-1 text-xs text-rust">{errors.time}</p>}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={values.venue}
                onChange={handleChange}
                placeholder="Lab 3"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-rust ${
                  errors.venue ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.venue && <p className="mt-1 text-xs text-rust">{errors.venue}</p>}
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Total Seats *
              </label>
              <input
                type="number"
                name="totalSeats"
                value={values.totalSeats}
                onChange={handleChange}
                placeholder="100"
                min="1"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-rust ${
                  errors.totalSeats ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.totalSeats && <p className="mt-1 text-xs text-rust">{errors.totalSeats}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-6 py-2.5 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60"
            >
              {submitting ? 'Creating Event...' : 'Add Event to Context'}
            </button>
          </div>
        </form>
      </div>

      {/* Events Table / Live List */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Live Events List (Shared Context State)</h2>
            <p className="font-mono text-xs text-slate">Updates instantly when events are created above</p>
          </div>
          <span className="font-mono text-xs font-semibold text-ink">{events.length} events active</span>
        </div>

        {events.length === 0 ? (
          <p className="font-mono text-sm text-slate py-8 text-center">No events found in context. Add one above.</p>
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

            {/* Mobile View */}
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
