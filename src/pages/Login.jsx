import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useForm from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

// Simple validation function passed into useForm — same shape works for
// Register, Create Event, etc. Keeps validation rules out of the JSX.
function validateLogin(values, isRegister) {
  const errors = {}
  if (isRegister && !values.name.trim()) errors.name = 'Name is required'
  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Enter a valid email'
  }
  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 6) {
    errors.password = 'Must be at least 6 characters'
  }
  return errors
}

export default function Login() {
  const [role, setRole] = useState('student')
  const [isRegister, setIsRegister] = useState(false)
  const [formError, setFormError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: '', email: '', password: '' },
    (v) => validateLogin(v, isRegister)
  )

  const onValid = async () => {
    setFormError(null)
    try {
      if (isRegister) {
        const response = await api.post('/users', {
          name: values.name,
          email: values.email,
          password: values.password,
          role,
        })
        const savedUser = response.data
        login({ id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role })
      } else {
        // Try to fetch existing users or create user record in DB
        let userObj = { name: values.name || (role === 'admin' ? 'Admin User' : 'Student User'), email: values.email, role }
        try {
          const res = await api.get('/users')
          const existing = res.data.find((u) => u.email === values.email)
          if (existing) {
            userObj = { id: existing._id, name: existing.name, email: existing.email, role: existing.role }
          } else {
            // Save initial record to MongoDB if not existing yet
            const created = await api.post('/users', {
              name: userObj.name,
              email: userObj.email,
              password: values.password || 'password123',
              role,
            })
            userObj = { id: created.data._id, name: created.data.name, email: created.data.email, role: created.data.role }
          }
        } catch (dbErr) {
          console.warn('Backend DB lookup fallback:', dbErr.message)
        }
        login(userObj)
      }

      if (role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      setFormError(err.response?.data?.error || 'Authentication failed. Please check backend connection.')
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
            Access pass
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
            Your seat at
            <br />
            every event,
            <br />
            one login away.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
            Students register and track registrations. Admins create events and manage
            headcount — same door, different key.
          </p>
        </div>

        <p className="relative font-mono text-[11px] text-paper/40">CampusPass © 2026</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-ink">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate">
            {isRegister ? 'Set up your CampusPass account.' : 'Log in to continue to CampusPass.'}
          </p>

          {/* Role tabs */}
          <div className="mt-6 flex rounded-full border border-ink/10 bg-paper-dim p-1">
            {['student', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
                  role === r ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {formError && (
            <p className="mt-4 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{formError}</p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onValid)} noValidate>
            {isRegister && (
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                  Full name
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
            )}
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
                {role === 'admin' ? 'Admin email' : 'College email'}
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder={role === 'admin' ? 'admin@college.edu' : 'you@college.edu'}
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-light disabled:opacity-60"
            >
              {submitting
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : `Log in as ${role}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="font-semibold text-rust hover:underline"
            >
              {isRegister ? 'Log in' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
