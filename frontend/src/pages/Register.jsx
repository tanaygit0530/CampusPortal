import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useForm from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

function validateRegister(values) {
  const errors = {}
  if (!values.name?.trim()) errors.name = 'Full name is required'
  if (!values.email?.trim()) {
    errors.email = 'Email address is required'
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
  const [serverError, setServerError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const searchParams = new URLSearchParams(location.search)
  const [activeRole, setActiveRole] = useState(
    searchParams.get('role') === 'admin' ? 'admin' : 'student'
  )

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    validateRegister
  )

  const onValid = async (formValues) => {
    setServerError(null)
    try {
      // Support student or admin creation
      const response = await api.post('/auth/register', {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        role: activeRole,
      })

      const { token, user } = response.data
      login(user, token)
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Registration error:', err)
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your network connection.'
      setServerError(message)
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
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber font-display text-lg text-ink font-bold">
          C
        </span>

        <div className="relative">
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-amber">
            {activeRole === 'admin' ? 'Administrator Access' : 'Student Access Pass'}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            {activeRole === 'admin' ? (
              <>
                Empower campus
                <br />
                events with full
                <br />
                control & insights.
              </>
            ) : (
              <>
                Join CampusPass
                <br />
                and reserve your
                <br />
                place at every event.
              </>
            )}
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
            {activeRole === 'admin'
              ? 'Register an administrator account to organize hackathons, track attendance, and publish certificates.'
              : 'Sign up for instant digital stubs, live seat availability, and event registrations.'}
          </p>
        </div>

        <p className="relative font-mono text-[11px] text-paper/40">CampusPass © 2026</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-5 sm:p-8 md:p-12">
        <div className="w-full max-w-sm">
          {/* Role selector tabs */}
          <div className="mb-6 flex rounded-xl bg-ink/5 p-1 border border-ink/10">
            <button
              type="button"
              onClick={() => {
                setActiveRole('student')
                setServerError(null)
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeRole === 'student'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-slate hover:text-ink'
              }`}
            >
              🎓 Student Signup
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('admin')
                setServerError(null)
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeRole === 'admin'
                  ? 'bg-ink text-paper shadow-sm'
                  : 'text-slate hover:text-ink'
              }`}
            >
              🛡️ Admin Signup
            </button>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            {activeRole === 'admin' ? 'Create admin account' : 'Create student account'}
          </h1>
          <p className="mt-2 text-sm text-slate">
            {activeRole === 'admin'
              ? 'Enter administrator credentials to manage campus events and rosters.'
              : 'Enter your college details below to start reserving event passes.'}
          </p>

          {serverError && (
            <div className="mt-4 rounded-xl border border-rust/30 bg-rust/10 p-3 text-xs font-semibold text-rust">
              {serverError}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
            <div>
              <label
                htmlFor="reg-fullname"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Full Name
              </label>
              <input
                id="reg-fullname"
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
                htmlFor="reg-collegemail"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                College Email
              </label>
              <input
                id="reg-collegemail"
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

            <div>
              <label
                htmlFor="reg-pwd"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Password
              </label>
              <input
                id="reg-pwd"
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
                  errors.password ? 'border-rust' : 'border-ink/15'
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-rust">{errors.password}</p>}
            </div>

            <div>
              <label
                htmlFor="reg-confirmpwd"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Confirm Password
              </label>
              <input
                id="reg-confirmpwd"
                type="password"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-rust ${
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
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? 'Creating account…'
                : activeRole === 'admin'
                ? 'Sign Up as Admin'
                : 'Sign Up as Student'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            Already have an account?{' '}
            <Link
              to={activeRole === 'admin' ? '/login?role=admin' : '/login'}
              className="font-semibold text-rust hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
