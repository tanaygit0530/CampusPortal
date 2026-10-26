import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../../context/EventContext'
import api from '../../api/axiosInstance'
import ConfirmModal from '../../components/ConfirmModal'

export default function AdminDashboard() {
  const { events, stats, deleteEvent, updateEvent, loading, error, refetch } = useEvents()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Export all attendee records across all events as CSV
  const handleExportAllCSV = async () => {
    setIsExporting(true)
    try {
      const response = await api.get('/registrations/all')
      const records = response.data || []

      if (records.length === 0) {
        alert('No registration records found to export.')
        setIsExporting(false)
        return
      }

      const headers = [
        'Registration ID',
        'Event Title',
        'Category',
        'Event Date',
        'Event Venue',
        'Student Name',
        'Student Email',
        'Phone',
        'Department',
        'Year',
        'Team Name',
        'Teammates',
        'Status',
        'Registered Timestamp',
      ]

      const rows = records.map((r) => {
        const regId = r._id || r.id || ''
        const eventTitle = r.event?.title || 'Unknown Event'
        const category = r.event?.category || 'General'
        const eventDate = r.event?.date || ''
        const venue = r.event?.venue || ''
        const studentName = r.student?.name || r.studentName || 'Student'
        const studentEmail = r.student?.email || r.studentEmail || ''
        const phone = r.phone || ''
        const department = r.department || ''
        const year = r.year || ''
        const teamName = r.teamName || 'N/A'
        const teammates = Array.isArray(r.teammates)
          ? r.teammates.map((t) => `${t.name || ''} (${t.email || ''})`).join('; ')
          : ''
        const status = r.status || 'confirmed'
        const registeredAt = r.createdAt ? new Date(r.createdAt).toLocaleString() : ''

        return [
          `"${regId}"`,
          `"${eventTitle.replace(/"/g, '""')}"`,
          `"${category.replace(/"/g, '""')}"`,
          `"${eventDate.replace(/"/g, '""')}"`,
          `"${venue.replace(/"/g, '""')}"`,
          `"${studentName.replace(/"/g, '""')}"`,
          `"${studentEmail.replace(/"/g, '""')}"`,
          `"${phone.replace(/"/g, '""')}"`,
          `"${department.replace(/"/g, '""')}"`,
          `"${year.replace(/"/g, '""')}"`,
          `"${teamName.replace(/"/g, '""')}"`,
          `"${teammates.replace(/"/g, '""')}"`,
          `"${status.replace(/"/g, '""')}"`,
          `"${registeredAt.replace(/"/g, '""')}"`,
        ].join(',')
      })

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `campuspass-all-registrations-${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setActionSuccess(`Exported ${records.length} attendee records to CSV.`)
      setTimeout(() => setActionSuccess(null), 3500)
    } catch (err) {
      console.error('Failed to export all CSV:', err)
      alert(err?.response?.data?.message || 'Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  // Toggle event status between open and closed
  const handleToggleStatus = async (event) => {
    const eventId = event._id || event.id
    const newStatus = event.status === 'open' ? 'closed' : 'open'
    setTogglingId(eventId)
    try {
      await updateEvent(eventId, { status: newStatus })
      setActionSuccess(`Event "${event.title}" is now ${newStatus.toUpperCase()}`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to toggle event status:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      const eventId = deleteTarget._id || deleteTarget.id
      try {
        await deleteEvent(eventId)
        setActionSuccess(`Event "${deleteTarget.title}" and its registrations were deleted.`)
        setTimeout(() => setActionSuccess(null), 3500)
      } catch (err) {
        console.error('Failed to delete event:', err)
      } finally {
        setDeleteTarget(null)
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header & Action Buttons */}
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs sm:text-[13px] uppercase tracking-[0.2em] text-rust font-semibold">
            Campus Administrator
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-ink">
            Admin Dashboard
          </h1>
          <p className="mt-1 font-body text-xs sm:text-sm text-slate">
            Real-time management for events, seat reservations, and student registrations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportAllCSV}
            disabled={isExporting}
            className="text-center rounded-full border border-ink/20 bg-white px-5 py-3 font-body text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            {isExporting ? 'Exporting...' : '📥 Export All Attendee Roster (CSV)'}
          </button>
          <Link
            to="/admin/events/new"
            className="text-center rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light cursor-pointer shadow-sm"
          >
            + Create New Event
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-amber/20 px-5 py-3 border border-amber/40 text-ink text-sm font-semibold animate-fade-in">
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-xs font-bold text-ink cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Real Totals Stat Cards from /api/stats */}
      <div className="mb-10 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Total Events</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {stats?.totalEvents ?? events.length}
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate">
            {stats?.openEvents ?? events.filter((e) => e.status === 'open').length} currently open
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
            Total Registrations
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {stats?.totalRegistrations ?? 0}
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate">Authoritative student passes</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate">Seats Filled</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {stats?.seatsFilledPercentage ?? 0}%
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate">
            {stats?.seatsFilled ?? 0} filled / {stats?.totalSeats ?? 0} total capacity
          </p>
        </div>
      </div>

      {/* Events Table / Mobile Cards */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">All Campus Events</h2>
            <p className="font-mono text-xs text-slate">
              Live events synchronized with MongoDB and Socket.IO
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-ink">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
            <span>{error}</span>
            <button onClick={refetch} className="font-semibold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <p className="font-mono text-sm text-slate py-12 text-center">Loading events from server...</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-paper/50 p-12 text-center">
            <h3 className="font-display text-lg font-semibold text-ink">
              Create your first event
            </h3>
            <p className="mt-1 text-sm text-slate">
              No campus events found in the database. Use the button above to publish your first listing.
            </p>
            <div className="mt-6">
              <Link
                to="/admin/events/new"
                className="rounded-full bg-ink px-6 py-2.5 font-body text-xs font-semibold text-paper hover:bg-ink-light"
              >
                + Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wider text-slate">
                  <th className="pb-3 pr-4">Event Title</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Date & Venue</th>
                  <th className="pb-3 px-4">Seats Left</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-sm">
                {events.map((e) => {
                  const eventId = e._id || e.id
                  const total = e.totalSeats || e.seatsTotal || 0
                  const left = e.seatsLeft !== undefined ? e.seatsLeft : total
                  const isClosed = e.status === 'closed'

                  return (
                    <tr key={eventId} className="hover:bg-paper/40 transition-colors">
                      <td className="py-4 pr-4 font-semibold text-ink">
                        <Link to={`/events/${eventId}`} className="hover:text-rust transition-colors">
                          {e.title}
                        </Link>
                        <span className="block font-mono text-[10px] text-slate font-normal">
                          {e.mode || 'on-campus'} · {e.isTeamEvent ? 'Team' : 'Individual'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">{e.category}</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">
                        {e.date}
                        <span className="block text-[11px] text-slate/80">{e.venue}</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-ink">
                        <span className={left <= 5 && left > 0 ? 'text-rust font-bold' : ''}>
                          {left} / {total} left
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                            !isClosed && left > 0
                              ? 'bg-amber/20 text-ink'
                              : 'bg-rust/20 text-rust'
                          }`}
                        >
                          {!isClosed && left > 0 ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <Link
                          to={`/admin/events/${eventId}/registrants`}
                          className="inline-block rounded-full border border-ink/20 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                        >
                          Registrants
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(e)}
                          disabled={togglingId === eventId}
                          className={`inline-block rounded-full px-3 py-1 font-mono text-[11px] uppercase font-semibold transition-colors cursor-pointer ${
                            isClosed
                              ? 'border border-amber bg-amber/10 text-ink hover:bg-amber'
                              : 'border border-ink/20 text-slate hover:border-ink hover:text-ink'
                          }`}
                        >
                          {isClosed ? 'Reopen' : 'Close'}
                        </button>
                        <Link
                          to={`/admin/events/${eventId}/edit`}
                          className="inline-block rounded-full border border-amber px-3 py-1 font-mono text-[11px] uppercase font-semibold text-ink transition-colors hover:bg-amber"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(e)}
                          className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust transition-colors hover:bg-rust hover:text-paper cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {events.map((e) => {
                const eventId = e._id || e.id
                const total = e.totalSeats || e.seatsTotal || 0
                const left = e.seatsLeft !== undefined ? e.seatsLeft : total
                const isClosed = e.status === 'closed'

                return (
                  <div
                    key={eventId}
                    className="rounded-2xl border border-ink/10 bg-paper-dim/30 p-5 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">{e.title}</h3>
                        <p className="font-mono text-[11px] text-slate">
                          {e.category} · {e.mode || 'on-campus'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                          !isClosed && left > 0 ? 'bg-amber/20 text-ink' : 'bg-rust/20 text-rust'
                        }`}
                      >
                        {!isClosed && left > 0 ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-slate">
                      📅 {e.date} · 📍 {e.venue}
                    </p>
                    <p className="font-mono text-xs text-ink font-semibold">
                      Seats: {left} / {total} Available
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ink/10">
                      <Link
                        to={`/admin/events/${eventId}/registrants`}
                        className="text-center rounded-full border border-ink/20 py-2 font-mono text-[11px] uppercase font-semibold text-ink hover:bg-ink hover:text-paper transition-colors"
                      >
                        Registrants
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(e)}
                        className="text-center rounded-full border border-ink/20 py-2 font-mono text-[11px] uppercase font-semibold text-ink hover:bg-ink hover:text-paper transition-colors"
                      >
                        {isClosed ? 'Reopen' : 'Close'}
                      </button>
                      <Link
                        to={`/admin/events/${eventId}/edit`}
                        className="text-center rounded-full border border-amber py-2 font-mono text-[11px] uppercase font-semibold text-ink hover:bg-amber transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(e)}
                        className="text-center rounded-full border border-rust/30 py-2 font-mono text-[11px] uppercase font-semibold text-rust hover:bg-rust hover:text-paper transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Event Confirmation Modal with warning */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Event & Registrations"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? WARNING: All confirmed registrations and attendee records for this event will also be permanently deleted from the database.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Yes, Permanently Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
