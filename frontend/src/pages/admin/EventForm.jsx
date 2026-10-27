import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useForm from '../../hooks/useForm'
import { useEvents } from '../../context/EventContext'

export const subcategoryMap = {
  Technical: [
    'Hackathon',
    'Coding Competition',
    'Web / App Development',
    'AI & Machine Learning',
    'Robotics & IoT',
    'Cybersecurity & CTF',
    'Paper / Project Presentation',
    'Other Technical',
  ],
  Sports: [
    'Cricket Tournament',
    'Football Championship',
    'Basketball',
    'Badminton Championship',
    'Table Tennis',
    'Chess Tournament',
    'Athletics & Track',
    'Volleyball',
    'Esports & Gaming',
    'Other Sports',
  ],
  Cultural: [
    'Battle of the Bands / Music',
    'Dance (Solo / Group)',
    'Drama & Theatre',
    'Fashion Show',
    'Fine Arts & Painting',
    'Photography & Film',
    'Standup Comedy',
    'Other Cultural',
  ],
  Workshop: [
    'Hands-on Tech Bootcamp',
    'UI/UX & Product Design',
    'Cloud & DevOps Workshop',
    'Career & Placement Prep',
    'Other Workshop',
  ],
  Seminar: [
    'Industry Expert Keynote',
    'Alumni Talk & Mentorship',
    'Research & Higher Studies',
    'Entrepreneurship & Startups',
    'Other Seminar',
  ],
  Other: [
    'General Campus Fest',
    'Community Service / Drive',
    'Networking Mixer',
    'Other',
  ],
}

const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other']
const modes = ['on-campus', 'online', 'hybrid']

function validateEvent(values) {
  const errors = {}
  if (!values.title?.trim()) errors.title = 'Title is required'
  if (!values.description?.trim()) errors.description = 'Description is required'
  if (!values.category) errors.category = 'Category is required'
  if (!values.date?.trim()) errors.date = 'Event date is required'
  if (!values.venue?.trim()) errors.venue = 'Venue is required'

  if (!values.totalSeats) {
    errors.totalSeats = 'Total seats is required'
  } else if (isNaN(values.totalSeats) || Number(values.totalSeats) <= 0) {
    errors.totalSeats = 'Total seats must be a positive integer'
  }

  if (values.registrationDeadline && values.date) {
    const deadline = new Date(values.registrationDeadline)
    const eventDate = new Date(values.date)
    if (!isNaN(deadline) && !isNaN(eventDate) && deadline > eventDate) {
      errors.registrationDeadline = 'Deadline must be before or on the event date'
    }
  }

  if (values.isTeamEvent) {
    const min = Number(values.minTeamSize)
    const max = Number(values.maxTeamSize)
    if (isNaN(min) || min < 1) errors.minTeamSize = 'Min team size must be at least 1'
    if (isNaN(max) || max < min) errors.maxTeamSize = 'Max team size must be ≥ Min team size'
  }

  return errors
}

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, createEvent, updateEvent } = useEvents()
  const [serverError, setServerError] = useState(null)
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false)

  const isEdit = Boolean(id)
  const existingEvent = isEdit ? events.find((e) => (e._id || e.id) === id || e.id === id) : null

  const { values, errors, submitting, handleChange, handleSubmit, reset, setValues } = useForm(
    {
      title: '',
      tagline: '',
      bannerUrl: '',
      category: 'Technical',
      subcategory: 'Hackathon',
      description: '',
      date: '',
      time: '10:00 AM',
      registrationDeadline: '',
      venue: '',
      mode: 'on-campus',
      totalSeats: '',
      isTeamEvent: false,
      minTeamSize: '2',
      maxTeamSize: '4',
      eligibility: 'Open to all students',
      prizes: '',
      rules: '',
      contactName: '',
      contactEmail: '',
    },
    validateEvent
  )

  const currentSubcategories = subcategoryMap[values.category] || []

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value
    const options = subcategoryMap[newCategory] || []
    const defaultSub = options[0] || ''
    setIsCustomSubcategory(false)
    setValues((prev) => ({
      ...prev,
      category: newCategory,
      subcategory: defaultSub,
    }))
  }

  const handleSubcategorySelect = (e) => {
    const val = e.target.value
    if (val === '__custom__') {
      setIsCustomSubcategory(true)
      setValues((prev) => ({ ...prev, subcategory: '' }))
    } else {
      setIsCustomSubcategory(false)
      setValues((prev) => ({ ...prev, subcategory: val }))
    }
  }

  useEffect(() => {
    if (isEdit && existingEvent) {
      const cat = existingEvent.category || 'Technical'
      const sub = existingEvent.subcategory || ''
      const options = subcategoryMap[cat] || []
      const isCustom = sub && !options.includes(sub)
      setIsCustomSubcategory(Boolean(isCustom))

      const initialForm = {
        title: existingEvent.title || '',
        tagline: existingEvent.tagline || '',
        bannerUrl: existingEvent.bannerUrl || '',
        category: cat,
        subcategory: sub || options[0] || '',
        description: existingEvent.description || '',
        date: existingEvent.date || '',
        time: existingEvent.time || '10:00 AM',
        registrationDeadline: existingEvent.registrationDeadline || '',
        venue: existingEvent.venue || '',
        mode: existingEvent.mode || 'on-campus',
        totalSeats: existingEvent.totalSeats ? String(existingEvent.totalSeats) : '',
        isTeamEvent: Boolean(existingEvent.isTeamEvent),
        minTeamSize: String(existingEvent.minTeamSize || 2),
        maxTeamSize: String(existingEvent.maxTeamSize || 4),
        eligibility: existingEvent.eligibility || 'Open to all students',
        prizes: existingEvent.prizes || '',
        rules: Array.isArray(existingEvent.rules)
          ? existingEvent.rules.join('\n')
          : existingEvent.rules || '',
        contactName: existingEvent.contactName || '',
        contactEmail: existingEvent.contactEmail || '',
      }
      reset()
      Object.keys(initialForm).forEach((key) => {
        handleChange({
          target: {
            name: key,
            value: initialForm[key],
            type: typeof initialForm[key] === 'boolean' ? 'checkbox' : 'text',
            checked: Boolean(initialForm[key]),
          },
        })
      })
    }
  }, [id, existingEvent])

  const onValid = async (formValues) => {
    setServerError(null)

    const payload = {
      ...formValues,
      totalSeats: parseInt(formValues.totalSeats, 10),
      isTeamEvent: Boolean(formValues.isTeamEvent),
      minTeamSize: formValues.isTeamEvent ? parseInt(formValues.minTeamSize, 10) : 1,
      maxTeamSize: formValues.isTeamEvent ? parseInt(formValues.maxTeamSize, 10) : 1,
      rules: formValues.rules ? formValues.rules.split('\n').filter(Boolean) : [],
    }

    try {
      if (isEdit) {
        await updateEvent(id, payload)
      } else {
        await createEvent(payload)
      }
      navigate('/admin')
    } catch (err) {
      console.error('Failed to save event:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save event. Please check required fields.'
      setServerError(msg)
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
            Event Management
          </span>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            {isEdit ? `Edit Event: ${existingEvent?.title || id}` : 'Create New Campus Event'}
          </h1>
          <p className="mt-1 text-sm text-slate">
            Provide event details, schedule, venue, capacity, and participation rules.
          </p>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rust/30 bg-rust/10 p-4 text-xs font-semibold text-rust">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onValid)} className="space-y-10" noValidate>
          {/* Section 1: Basic Info */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              1. Basic Information
            </h3>

            <div>
              <label
                htmlFor="evt-title"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Event Title *
              </label>
              <input
                id="evt-title"
                type="text"
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="e.g. Annual Hackathon 2026"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.title ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-rust">{errors.title}</p>}
            </div>

            <div>
              <label
                htmlFor="evt-tagline"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Tagline / Subheading
              </label>
              <input
                id="evt-tagline"
                type="text"
                name="tagline"
                value={values.tagline}
                onChange={handleChange}
                placeholder="One-line summary for event card"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="evt-category"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Category *
                </label>
                <select
                  id="evt-category"
                  name="category"
                  value={values.category}
                  onChange={handleCategoryChange}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="evt-subcategory"
                    className="block font-mono text-[11px] uppercase tracking-wider text-slate"
                  >
                    Subcategory
                  </label>
                  <span className="font-mono text-[10px] text-rust font-medium">
                    {values.category} Focus
                  </span>
                </div>
                <select
                  id="evt-subcategory"
                  name="subcategory"
                  value={
                    isCustomSubcategory
                      ? '__custom__'
                      : currentSubcategories.includes(values.subcategory)
                      ? values.subcategory
                      : currentSubcategories[0] || ''
                  }
                  onChange={handleSubcategorySelect}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                >
                  {currentSubcategories.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                  <option value="__custom__">✏️ + Custom Subcategory...</option>
                </select>
              </div>
            </div>

            {isCustomSubcategory && (
              <div>
                <label
                  htmlFor="evt-custom-sub"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-rust font-semibold"
                >
                  Custom Subcategory Name
                </label>
                <input
                  id="evt-custom-sub"
                  type="text"
                  name="subcategory"
                  value={values.subcategory}
                  onChange={handleChange}
                  placeholder="e.g. Genesis 2.0 Hackathon, Box Cricket 3v3..."
                  className="w-full rounded-xl border border-rust/40 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust shadow-sm"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="evt-banner"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Banner Image URL (Optional)
              </label>
              <input
                id="evt-banner"
                type="url"
                name="bannerUrl"
                value={values.bannerUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div>
              <label
                htmlFor="evt-desc"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Full Description *
              </label>
              <textarea
                id="evt-desc"
                name="description"
                rows={4}
                value={values.description}
                onChange={handleChange}
                placeholder="Comprehensive description of the event..."
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
              2. Schedule & Venue
            </h3>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="evt-date"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Event Date *
                </label>
                <input
                  id="evt-date"
                  type="text"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  placeholder="e.g. Nov 15, 2026"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.date ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.date && <p className="mt-1 text-xs text-rust">{errors.date}</p>}
              </div>

              <div>
                <label
                  htmlFor="evt-time"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Time
                </label>
                <input
                  id="evt-time"
                  type="text"
                  name="time"
                  value={values.time}
                  onChange={handleChange}
                  placeholder="10:00 AM"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>

              <div>
                <label
                  htmlFor="evt-deadline"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Registration Deadline
                </label>
                <input
                  id="evt-deadline"
                  type="text"
                  name="registrationDeadline"
                  value={values.registrationDeadline}
                  onChange={handleChange}
                  placeholder="e.g. Nov 14, 2026"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.registrationDeadline ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.registrationDeadline && (
                  <p className="mt-1 text-xs text-rust">{errors.registrationDeadline}</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="evt-venue"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Venue *
                </label>
                <input
                  id="evt-venue"
                  type="text"
                  name="venue"
                  value={values.venue}
                  onChange={handleChange}
                  placeholder="Auditorium / Lab 3 / Online"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.venue ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.venue && <p className="mt-1 text-xs text-rust">{errors.venue}</p>}
              </div>

              <div>
                <label
                  htmlFor="evt-mode"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Mode
                </label>
                <select
                  id="evt-mode"
                  name="mode"
                  value={values.mode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust capitalize"
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

          {/* Section 3: Participation & Capacity */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              3. Participation & Seats Capacity
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 items-center">
              <div>
                <label
                  htmlFor="evt-seats"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Total Seats Available *
                </label>
                <input
                  id="evt-seats"
                  type="number"
                  name="totalSeats"
                  value={values.totalSeats}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                    errors.totalSeats ? 'border-rust' : 'border-ink/15'
                  }`}
                />
                {errors.totalSeats && <p className="mt-1 text-xs text-rust">{errors.totalSeats}</p>}
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isTeamEvent"
                    checked={values.isTeamEvent}
                    onChange={(e) =>
                      handleChange({ target: { name: 'isTeamEvent', value: e.target.checked } })
                    }
                    className="h-5 w-5 accent-rust rounded cursor-pointer"
                  />
                  <span className="font-mono text-xs font-semibold uppercase text-ink">
                    Team Participation Event
                  </span>
                </label>
              </div>
            </div>

            {values.isTeamEvent && (
              <div className="grid gap-5 sm:grid-cols-2 rounded-xl bg-white p-4 border border-ink/10">
                <div>
                  <label
                    htmlFor="evt-minteam"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                  >
                    Min Team Size
                  </label>
                  <input
                    id="evt-minteam"
                    type="number"
                    name="minTeamSize"
                    value={values.minTeamSize}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rust"
                  />
                  {errors.minTeamSize && (
                    <p className="mt-1 text-xs text-rust">{errors.minTeamSize}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="evt-maxteam"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                  >
                    Max Team Size
                  </label>
                  <input
                    id="evt-maxteam"
                    type="number"
                    name="maxTeamSize"
                    value={values.maxTeamSize}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm outline-none focus:border-rust"
                  />
                  {errors.maxTeamSize && (
                    <p className="mt-1 text-xs text-rust">{errors.maxTeamSize}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="evt-eligibility"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Eligibility
              </label>
              <input
                id="evt-eligibility"
                type="text"
                name="eligibility"
                value={values.eligibility}
                onChange={handleChange}
                placeholder="e.g. Open to all registered students"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>
          </div>

          {/* Section 4: Prizes & Guidelines */}
          <div className="space-y-5 rounded-2xl border border-ink/10 bg-paper-dim/30 p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-rust border-b border-ink/10 pb-2">
              4. Prizes, Guidelines & Contact
            </h3>

            <div>
              <label
                htmlFor="evt-prizes"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Prizes & Awards (Optional)
              </label>
              <input
                id="evt-prizes"
                type="text"
                name="prizes"
                value={values.prizes}
                onChange={handleChange}
                placeholder="e.g. Winner ₹10,000 + Trophy"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div>
              <label
                htmlFor="evt-rules"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Rules & Guidelines (One per line)
              </label>
              <textarea
                id="evt-rules"
                name="rules"
                rows={3}
                value={values.rules}
                onChange={handleChange}
                placeholder="1. Carry college ID.&#10;2. Be on time."
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="evt-contactname"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Contact Coordinator Name
                </label>
                <input
                  id="evt-contactname"
                  type="text"
                  name="contactName"
                  value={values.contactName}
                  onChange={handleChange}
                  placeholder="Prof. Ramesh Rao"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>

              <div>
                <label
                  htmlFor="evt-contactemail"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
                >
                  Contact Email
                </label>
                <input
                  id="evt-contactemail"
                  type="email"
                  name="contactEmail"
                  value={values.contactEmail}
                  onChange={handleChange}
                  placeholder="events@campuspass.edu"
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 border-t border-ink/10">
            <Link
              to="/admin"
              className="text-center rounded-full border border-ink/20 px-6 py-2.5 text-xs font-semibold text-ink hover:bg-ink/5 cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="text-center rounded-full bg-ink px-8 py-3 text-xs font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {submitting ? 'Saving Event...' : isEdit ? 'Update Event Listing' : 'Publish Campus Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
