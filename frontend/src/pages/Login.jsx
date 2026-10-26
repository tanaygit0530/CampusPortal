import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useForm from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

function validateLogin(values) {
  const errors = {}
  if (!values.email?.trim()) {
    errors.email = 'Email address is required'
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!values.password) {
    errors.password = 'Password is required'
  }
  return errors
}

export default function Login() {
  const [serverError, setServerError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Check if redirected due to session expiry
  const searchParams = new URLSearchParams(location.search)
  const isExpired = searchParams.get('expired') === 'true'

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { email: '', password: '' },
    validateLogin
  )

  const onValid = async (formValues) => {
    setServerError(null)
    try {
      const response = await api.post('/auth/login', {
        email: formValues.email.trim(),
        password: formValues.password,
      })

      const { token, user } = response.data
      login(user, token)

      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to connect to server. Please try again.'
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
            Campus Access Portal
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Your seat at
            <br />
            every event,
            <br />
            one login away.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
            Real-time campus pass system backed by authoritative MongoDB records and live WebSockets.
          </p>
        </div>

        <p className="relative font-mono text-[11px] text-paper/40">CampusPass © 2026</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-slate">
            Log in with your college credentials to access your dashboard.
          </p>

          {isExpired && !serverError && (
            <div className="mt-4 rounded-xl border border-amber/40 bg-amber/10 p-3 text-xs font-semibold text-ink">
              Your session has expired. Please log in again to continue.
            </div>
          )}

          {serverError && (
            <div className="mt-4 rounded-xl border border-rust/30 bg-rust/10 p-3 text-xs font-semibold text-rust">
              {serverError}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Email Address
              </label>
              <input
                id="login-email"
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
                htmlFor="login-password"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate"
              >
                Password
              </label>
              <input
                id="login-password"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Authenticating…' : 'Log In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-rust hover:underline">
              Sign up as a student
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
