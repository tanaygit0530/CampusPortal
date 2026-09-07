import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useForm from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'

function validateRegister(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Full name is required'
  if (!values.email.trim()) {
    errors.email = 'College email is required'
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

export default function Register() {
  const [formError, setFormError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    validateRegister
  )

  const onValid = async (formValues) => {
    setFormError(null)
    try {
      await new Promise((res) => setTimeout(res, 500))
      login({ name: formValues.name, email: formValues.email, role: 'student' })
      navigate('/dashboard')
    } catch {
      setFormError('Account creation failed. Please try again.')
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-73px)] md:grid-cols-2">
      {/* Left ceremonial panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #FAF6EE 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber font-display text-lg text-ink">
          C
        </span>

        <div className="relative">
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-amber">
            Student Access Pass
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Join CampusPass
            <br />
            and reserve your
            <br />
            place at every event.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
            Create an account to browse campus fests, hackathons, seminars, and sports meets with instant digital pass issuance.
          </p>
        </div>

        <p className="relative font-mono text-[11px] text-paper/40">CampusPass © 2026</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-ink">Create student account</h1>
          <p className="mt-2 text-sm text-slate">Enter your details to set up your CampusPass account.</p>

          {formError && (
            <p className="mt-4 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{formError}</p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Ananya Sharma"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.name ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rust">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                College Email
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="you@college.edu"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.email ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rust">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.password ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-rust">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.confirmPassword ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rust">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-rust hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
