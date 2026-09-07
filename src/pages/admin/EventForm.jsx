import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import { useEvents } from '../../context/EventContext'

const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar']
const modes = ['On-campus', 'Online', 'Hybrid']

function validateEvent(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Title is required'
  if (!values.tagline.trim()) errors.tagline = 'Tagline is required'
  if (!values.description.trim()) errors.description = 'Description is required'
  if (!values.category) errors.category = 'Category is required'
  if (!values.date.trim()) errors.date = 'Date is required'
  if (!values.time.trim()) errors.time = 'Time is required'
  if (!values.venue.trim()) errors.venue = 'Venue is required'

  if (!values.totalSeats) {
    errors.totalSeats = 'Total seats is required'
  } else if (isNaN(values.totalSeats) || Number(values.totalSeats) <= 0) {
    errors.totalSeats = 'Total seats must be a positive number'
  }

  if (values.isTeamEvent) {
    const min = Number(values.minTeamSize)
    const max = Number(values.maxTeamSize)
    if (isNaN(min) || min < 1) errors.minTeamSize = 'Min size must be at least 1'
    if (isNaN(max) || max < min) errors.maxTeamSize = 'Max size must be ≥ Min size'
  }

  return errors
}

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, addEvent, updateEvent } = useEvents()
  const [formError, setFormError] = useState(null)

  const isEdit = Boolean(id)
  const existingEvent = isEdit ? events.find((e) => e.id === id) : null

  const { values, errors, submitting, handleChange, handleSubmit, reset } = useForm(
    {
      title: '',
      tagline: '',
      bannerUrl: '',
      category: 'Technical',
      description: '',
      date: '',
      time: '',
      registrationDeadline: '',
      venue: '',
      mode: 'On-campus',
      totalSeats: '',
      isTeamEvent: false,
      minTeamSize: '1',
      maxTeamSize: '4',
      eligibility: 'Open to all students',
      prizes: '',
      rules: '',
      contactName: '',
      contactEmail: '',
    },
    validateEvent
  )

  useEffect(() => {
    if (isEdit && existingEvent) {
      const initialForm = {
        title: existingEvent.title || '',
        tagline: existingEvent.tagline || '',
        bannerUrl: existingEvent.bannerUrl || '',
        category: existingEvent.category || 'Technical',
        description: existingEvent.description || '',
        date: existingEvent.date || '',
        time: existingEvent.time || '',
        registrationDeadline: existingEvent.registrationDeadline || '',
        venue: existingEvent.venue || '',
        mode: existingEvent.mode || 'On-campus',
        totalSeats: existingEvent.totalSeats ? String(existingEvent.totalSeats) : '',
        isTeamEvent: Boolean(existingEvent.isTeamEvent),
        minTeamSize: String(existingEvent.minTeamSize || 1),
        maxTeamSize: String(existingEvent.maxTeamSize || 4),
        eligibility: existingEvent.eligibility || 'Open to all students',
        prizes: existingEvent.prizes || '',
        rules: existingEvent.rules || '',
        contactName: existingEvent.contactName || '',
        contactEmail: existingEvent.contactEmail || '',
      }
      reset()
      Object.keys(initialForm).forEach((key) => {
        handleChange({ target: { name: key, value: initialForm[key], type: typeof initialForm[key] === 'boolean' ? 'checkbox' : 'text', checked: Boolean(initialForm[key]) } })
      })
    }
  }, [id])

  const onValid = async (formValues) => {
    setFormError(null)
    try {
      if (isEdit) {
        updateEvent(id, formValues)
      } else {
        addEvent(formValues)
      }
      navigate('/admin')
    } catch {
      setFormError('Failed to save event. Please verify input fields.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate transition-colors hover:text-ink"
      >
        ← Back to Admin Dashboard
      </Link>

      <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-sm space-y-8">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-rust">
            Unstop-Style Event Builder
          </span>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            {isEdit ? `Edit Event — ${existingEvent?.id || id}` : 'Create Campus Event Listing'}
          </h1>
          <p className="mt-1 text-sm text-slate">
            Provide comprehensive event details, eligibility criteria, schedules, and prize info.
          </p>
        </div>

        {formError && (
          <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{formError}</p>
        )}

        <form onSubmit={handleSubmit(onValid)} className="space-y-10" noValidate>
          {/* Section 1: Basic Info */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              1. Basic Information
            </h3>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="e.g. Inter-College Hackathon 2026"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.title ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-rust">{errors.title}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Short Tagline *
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={values.tagline}
                  onChange={handleChange}
                  placeholder="One-liner summary for card preview"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.tagline ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.tagline && <p className="mt-1 text-xs text-rust">{errors.tagline}</p>}
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Category *
                </label>
                <select
                  name="category"
                  value={values.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                name="bannerUrl"
                value={values.bannerUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Full Description *
              </label>
              <textarea
                name="description"
                rows={4}
                value={values.description}
                onChange={handleChange}
                placeholder="Provide a thorough overview of the event..."
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.description ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.description && <p className="mt-1 text-xs text-rust">{errors.description}</p>}
            </div>
          </div>

          {/* Section 2: Schedule & Venue */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              2. Schedule & Venue Details
            </h3>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Event Date *
                </label>
                <input
                  type="text"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  placeholder="Oct 25, 2026"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.date ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.date && <p className="mt-1 text-xs text-rust">{errors.date}</p>}
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Time *
                </label>
                <input
                  type="text"
                  name="time"
                  value={values.time}
                  onChange={handleChange}
                  placeholder="10:00 AM"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.time ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.time && <p className="mt-1 text-xs text-rust">{errors.time}</p>}
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Registration Deadline
                </label>
                <input
                  type="text"
                  name="registrationDeadline"
                  value={values.registrationDeadline}
                  onChange={handleChange}
                  placeholder="Oct 23, 2026"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={values.venue}
                  onChange={handleChange}
                  placeholder="e.g. CS Seminar Hall"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.venue ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.venue && <p className="mt-1 text-xs text-rust">{errors.venue}</p>}
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Mode
                </label>
                <select
                  name="mode"
                  value={values.mode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                >
                  {modes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Participation & Eligibility */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              3. Participation & Team Structure
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 items-center">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Total Seats Capacity *
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  value={values.totalSeats}
                  onChange={handleChange}
                  placeholder="150"
                  min="1"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.totalSeats ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.totalSeats && <p className="mt-1 text-xs text-rust">{errors.totalSeats}</p>}
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    name="isTeamEvent"
                    checked={values.isTeamEvent}
                    onChange={(e) =>
                      handleChange({ target: { name: 'isTeamEvent', value: e.target.checked } })
                    }
                    className="h-5 w-5 accent-rust rounded"
                  />
                  <span className="font-mono text-xs font-semibold uppercase text-ink">
                    This is a Team Event
                  </span>
                </label>
              </div>
            </div>

            {values.isTeamEvent && (
              <div className="grid gap-5 sm:grid-cols-2 rounded-xl bg-white p-4 border border-ink/10">
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    name="minTeamSize"
                    value={values.minTeamSize}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rust"
                  />
                  {errors.minTeamSize && <p className="mt-1 text-xs text-rust">{errors.minTeamSize}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    name="maxTeamSize"
                    value={values.maxTeamSize}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rust"
                  />
                  {errors.maxTeamSize && <p className="mt-1 text-xs text-rust">{errors.maxTeamSize}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Eligibility Criteria
              </label>
              <input
                type="text"
                name="eligibility"
                value={values.eligibility}
                onChange={handleChange}
                placeholder="e.g. Open to all CS & IT 3rd/4th year students"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>
          </div>

          {/* Section 4: Extras & Contact */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              4. Prizes, Guidelines & Contact
            </h3>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Prizes & Rewards
              </label>
              <input
                type="text"
                name="prizes"
                value={values.prizes}
                onChange={handleChange}
                placeholder="e.g. ₹20,000 Cash Pool + Certificates"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Rules & Guidelines (One per line)
              </label>
              <textarea
                name="rules"
                rows={3}
                value={values.rules}
                onChange={handleChange}
                placeholder="1. Bring valid college ID badge.&#10;2. Late entries will not be allowed."
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Contact Coordinator Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={values.contactName}
                  onChange={handleChange}
                  placeholder="Prof. Ramesh Rao"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Contact Email / Phone
                </label>
                <input
                  type="text"
                  name="contactEmail"
                  value={values.contactEmail}
                  onChange={handleChange}
                  placeholder="coordinator@college.edu"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-ink/10">
            <Link
              to="/admin"
              className="rounded-full border border-ink/20 px-6 py-2.5 text-xs font-semibold text-ink hover:bg-ink/5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-8 py-3 text-xs font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60"
            >
              {submitting ? 'Saving Event...' : isEdit ? 'Update Event Listing' : 'Publish Unstop Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
