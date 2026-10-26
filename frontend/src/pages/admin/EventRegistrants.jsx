import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../../context/EventContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../api/axiosInstance'
import ConfirmModal from '../../components/ConfirmModal'

export default function EventRegistrants() {
  const { id } = useParams()
  const { events } = useEvents()
  const { socket } = useSocket()

  const [registrants, setRegistrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  const event = events.find((e) => (e._id || e.id) === id || e.id === id)
  const eventId = event?._id || event?.id || id

  // Fetch real registrants from MongoDB
  const fetchRegistrants = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/registrations/event/${eventId}`)
      setRegistrants(response.data || [])
    } catch (err) {
      console.error('Error fetching event registrants:', err)
      setError(err?.response?.data?.message || 'Failed to fetch event registrants')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchRegistrants()
  }, [fetchRegistrants])

  // Live Socket.IO updates for this specific event's registrants table
  useEffect(() => {
    if (!socket) return

    const handleRegistrationCreated = (data) => {
      if (data?.eventId === eventId && data.registration) {
        setRegistrants((prev) => {
          const regId = data.registration._id || data.registration.id
          if (prev.some((r) => (r._id || r.id) === regId)) return prev
          return [data.registration, ...prev]
        })
      }
    }

    const handleRegistrationCancelled = (data) => {
      if (data?.eventId === eventId) {
        setRegistrants((prev) =>
          prev.filter((r) => (r._id || r.id) !== data.registrationId)
        )
      }
    }

    socket.on('registration:created', handleRegistrationCreated)
    socket.on('registration:cancelled', handleRegistrationCancelled)

    return () => {
      socket.off('registration:created', handleRegistrationCreated)
      socket.off('registration:cancelled', handleRegistrationCancelled)
    }
  }, [socket, eventId])

  // Admin removes a registrant
  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    const regId = removeTarget._id || removeTarget.id
    try {
      await api.delete(`/registrations/admin/${regId}`)
      setRegistrants((prev) => prev.filter((r) => (r._id || r.id) !== regId))
      setActionNotice(`Removed registrant and restored 1 seat.`)
      setTimeout(() => setActionNotice(null), 3000)
    } catch (err) {
      console.error('Failed to remove registrant:', err)
      setActionNotice(err?.response?.data?.message || 'Failed to remove registrant')
    } finally {
      setRemoveTarget(null)
    }
  }

  // Export registrants table as CSV
  const handleExportCSV = () => {
    if (registrants.length === 0) return

    const headers = [
      'Student Name',
      'Email',
      'Phone',
      'Department',
      'Year',
      'Team Name',
      'Teammates',
      'Status',
      'Registered Date',
    ]

    const rows = registrants.map((r) => {
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
      const registeredAt = r.createdAt
        ? new Date(r.createdAt).toLocaleString()
        : r.registeredAt || ''

      return [
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
      `campuspass-registrants-${(event?.title || 'event').replace(/\s+/g, '-').toLowerCase()}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!event && !loading) {
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

  const totalCapacity = event?.totalSeats || event?.seatsTotal || 0

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate transition-colors hover:text-ink"
      >
        ← Back to Admin Dashboard
      </Link>

      {actionNotice && (
        <div className="mt-4 rounded-xl bg-amber/20 px-4 py-2.5 text-xs font-semibold text-ink border border-amber/40">
          ✓ {actionNotice}
        </div>
      )}

      {/* Event Overview Banner */}
      <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-rust font-semibold">
              {event?.category} · {event?.mode || 'on-campus'}
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{event?.title}</h1>
            <p className="mt-1 font-mono text-xs text-slate">
              📅 {event?.date} · ⏰ {event?.time || '10:00 AM'} · 📍 {event?.venue}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-display text-3xl font-semibold text-ink">
                {registrants.length}{' '}
                <span className="text-base font-normal text-slate">/ {totalCapacity}</span>
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate">
                Confirmed Attendees
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={registrants.length === 0}
              title={registrants.length === 0 ? "No attendees registered yet to export" : "Download Attendee Roster as CSV"}
              className="rounded-full bg-ink px-5 py-2.5 font-mono text-xs uppercase font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Registrants Table */}
      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            Official Attendee Roster
          </h2>
          <span className="font-mono text-xs text-slate">
            {registrants.length} registered {registrants.length === 1 ? 'student' : 'students'}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rust/10 p-3 text-xs text-rust font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <p className="font-mono text-sm text-slate py-8 text-center">Loading attendee records...</p>
        ) : registrants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center font-mono text-sm text-slate">
            No students registered for this event yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden lg:table">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wider text-slate">
                  <th className="pb-3 pr-4">Student Name</th>
                  <th className="pb-3 px-4">Contact Info</th>
                  <th className="pb-3 px-4">Dept & Year</th>
                  <th className="pb-3 px-4">Team / Teammates</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-sm">
                {registrants.map((r) => {
                  const regId = r._id || r.id
                  const studentName = r.student?.name || r.studentName || 'Student'
                  const studentEmail = r.student?.email || r.studentEmail || 'No email'

                  return (
                    <tr key={regId} className="hover:bg-paper/40 transition-colors">
                      <td className="py-4 pr-4 font-semibold text-ink">
                        {studentName}
                        <span className="block font-mono text-[10px] text-slate font-normal">
                          ID: {regId.slice(-6)}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">
                        <div>{studentEmail}</div>
                        <div className="text-[11px] text-slate/70">📞 {r.phone || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate">
                        {r.department || 'General'} · {r.year || '1st'}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-ink">
                        {r.teamName ? (
                          <div>
                            <span className="font-semibold text-rust">Team: {r.teamName}</span>
                            {Array.isArray(r.teammates) && r.teammates.length > 0 && (
                              <div className="text-[10px] text-slate mt-0.5">
                                +{r.teammates.length} {r.teammates.length === 1 ? 'teammate' : 'teammates'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate">Individual Entry</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                            r.status === 'confirmed'
                              ? 'bg-amber/20 text-ink'
                              : 'bg-rust/20 text-rust'
                          }`}
                        >
                          {r.status || 'confirmed'}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setRemoveTarget({
                              _id: regId,
                              studentName,
                              studentEmail,
                            })
                          }
                          className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust transition-colors hover:bg-rust hover:text-paper cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile / Responsive Cards */}
            <div className="space-y-4 lg:hidden">
              {registrants.map((r) => {
                const regId = r._id || r.id
                const studentName = r.student?.name || r.studentName || 'Student'
                const studentEmail = r.student?.email || r.studentEmail || 'No email'

                return (
                  <div
                    key={regId}
                    className="rounded-xl border border-ink/10 bg-paper-dim/30 p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-ink">{studentName}</h3>
                        <p className="font-mono text-[11px] text-slate">{studentEmail}</p>
                        <p className="font-mono text-[10px] text-slate">📞 {r.phone || 'N/A'}</p>
                      </div>
                      <span className="rounded-full bg-amber/20 px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold text-ink">
                        {r.status || 'confirmed'}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-slate pt-1">
                      <span>
                        Dept: {r.department || 'General'} ({r.year || '1st'})
                      </span>
                      {r.teamName && (
                        <span className="block text-rust font-semibold mt-0.5">
                          Team: {r.teamName}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-ink/10 flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate">Pass #{regId.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRemoveTarget({
                            _id: regId,
                            studentName,
                            studentEmail,
                          })
                        }
                        className="rounded-full border border-rust/30 px-3 py-1 font-mono text-[11px] uppercase font-semibold text-rust"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        title="Remove Student Attendee"
        message={`Are you sure you want to remove ${removeTarget?.studentName} (${removeTarget?.studentEmail}) from this event? This will revoke their pass and restore 1 seat immediately.`}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
        confirmText="Yes, Remove & Restore Seat"
        cancelText="Cancel"
      />
    </div>
  )
}
