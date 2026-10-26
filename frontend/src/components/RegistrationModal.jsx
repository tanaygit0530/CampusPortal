import { useState, useEffect } from 'react'
import useForm from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../context/EventContext'

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'General / Other',
]
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']

export default function RegistrationModal({ isOpen, onClose, event, onSuccess }) {
  const { user } = useAuth()
  const { registerForEvent } = useEvents()
  const [agreed, setAgreed] = useState(false)
  const [agreedError, setAgreedError] = useState(null)
  const [serverError, setServerError] = useState(null)

  // Dynamic teammates list for team events
  const [teammates, setTeammates] = useState([])

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setAgreed(false)
      setAgreedError(null)
      setServerError(null)
      setTeammates([])
    }
  }, [isOpen])

  const validate = (values) => {
    const errors = {}
    if (!values.name?.trim()) errors.name = 'Full name is required'
    if (!values.email?.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!values.phone?.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(values.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit phone number'
    }
    if (event?.isTeamEvent) {
      if (!values.teamName?.trim()) errors.teamName = 'Team name is required for team events'
    }
    return errors
  }

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      department: departments[0],
      year: years[2],
      teamName: '',
      notes: '',
    },
    validate
  )

  if (!isOpen || !event) return null

  const maxTeammates = Math.max(0, (event.maxTeamSize || 1) - 1)

  const handleAddTeammate = () => {
    if (teammates.length < maxTeammates) {
      setTeammates([...teammates, { name: '', email: '' }])
    }
  }

  const handleTeammateChange = (index, field, val) => {
    const updated = [...teammates]
    updated[index][field] = val
    setTeammates(updated)
  }

  const handleRemoveTeammate = (index) => {
    setTeammates(teammates.filter((_, i) => i !== index))
  }

  const onValid = async (formValues) => {
    if (!agreed) {
      setAgreedError('You must agree to the event rules to proceed')
      return
    }
    setAgreedError(null)
    setServerError(null)

    const payload = {
      phone: formValues.phone.trim(),
      department: formValues.department,
      year: formValues.year,
      teamName: formValues.teamName.trim(),
      teammates: teammates.filter((t) => t.name.trim() || t.email.trim()),
      notes: formValues.notes.trim(),
      rulesAccepted: true,
    }

    try {
      const eventId = event._id || event.id
      await registerForEvent(eventId, payload)
      onClose()
      if (onSuccess) {
        onSuccess(`Registration confirmed! Your seat is reserved.`)
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please check your details and try again.'
      setServerError(msg)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="my-8 w-full max-w-xl rounded-3xl border border-ink/10 bg-paper p-6 sm:p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-rust font-semibold">
              Event Registration
            </span>
            <h2 id="modal-title" className="mt-1 font-display text-2xl font-semibold text-ink">
              {event.title}
            </h2>
            <p className="font-mono text-xs text-slate">
              {event.date} · {event.time || '10:00 AM'} · {event.venue}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close registration dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-dim text-ink hover:bg-ink/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {serverError && (
          <div className="mt-4 rounded-xl border border-rust/30 bg-rust/10 p-3 text-xs font-semibold text-rust">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onValid)} className="mt-6 space-y-5" noValidate>
          {/* Personal Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-name"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Your full name"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.name ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rust">{errors.name}</p>}
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="your.email@college.edu"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.email ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rust">{errors.email}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="reg-phone"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Phone Number *
              </label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                placeholder="10-digit mobile"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.phone ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-rust">{errors.phone}</p>}
            </div>

            <div>
              <label
                htmlFor="reg-dept"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Department
              </label>
              <select
                id="reg-dept"
                name="department"
                value={values.department}
                onChange={handleChange}
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reg-year"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Academic Year
              </label>
              <select
                id="reg-year"
                name="year"
                value={values.year}
                onChange={handleChange}
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Fields (if team event) */}
          {event.isTeamEvent && (
            <div className="rounded-2xl border border-rust/20 bg-rust/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-rust">
                  Team Entry Details ({event.minTeamSize || 2}–{event.maxTeamSize || 4} Members)
                </h4>
              </div>

              <div>
                <label
                  htmlFor="reg-teamName"
                  className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Team Name *
                </label>
                <input
                  id="reg-teamName"
                  type="text"
                  name="teamName"
                  value={values.teamName}
                  onChange={handleChange}
                  placeholder="e.g. Algorunners"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.teamName ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.teamName && <p className="mt-1 text-xs text-rust">{errors.teamName}</p>}
              </div>

              {/* Dynamic Teammates */}
              {teammates.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="font-mono text-[11px] uppercase text-slate">Teammates</p>
                  {teammates.map((tm, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 border border-ink/10"
                    >
                      <input
                        type="text"
                        placeholder={`Teammate ${idx + 2} Full Name`}
                        value={tm.name}
                        onChange={(e) => handleTeammateChange(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs outline-none focus:border-rust"
                      />
                      <input
                        type="email"
                        placeholder="Teammate Email"
                        value={tm.email}
                        onChange={(e) => handleTeammateChange(idx, 'email', e.target.value)}
                        className="flex-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs outline-none focus:border-rust"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTeammate(idx)}
                        className="text-rust text-xs font-bold px-2 py-1 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {teammates.length < maxTeammates && (
                <button
                  type="button"
                  onClick={handleAddTeammate}
                  className="rounded-full border border-rust/40 bg-white px-4 py-1.5 font-mono text-xs text-rust font-semibold hover:bg-rust hover:text-paper transition-colors cursor-pointer"
                >
                  + Add Teammate ({teammates.length + 1}/{event.maxTeamSize})
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              htmlFor="reg-notes"
              className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
            >
              Additional Notes (Optional)
            </label>
            <textarea
              id="reg-notes"
              name="notes"
              rows={2}
              value={values.notes}
              onChange={handleChange}
              placeholder="Any requirements or comments..."
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
            />
          </div>

          {/* Agreement Checkbox */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  if (e.target.checked) setAgreedError(null)
                }}
                className="mt-1 h-4 w-4 accent-rust cursor-pointer"
              />
              <span className="text-xs text-slate leading-relaxed">
                I agree to the event rules, guidelines, code of conduct, and terms of participation.
              </span>
            </label>
            {agreedError && <p className="mt-1 text-xs text-rust">{agreedError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold text-ink hover:bg-ink/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Submitting Registration...' : 'Confirm & Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
