import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { isConnected } = useSocket()

  const handleLogout = () => {
    logout()
    navigate('/')
    setOpen(false)
  }

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'User'

  const links = isAuthenticated
    ? [
        { to: '/', label: 'Home' },
        { to: '/dashboard', label: 'Dashboard' },
        ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/login', label: 'Log in' },
      ]

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-lg text-amber">
              C
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">
              Campus<span className="text-rust">Pass</span>
            </span>
          </Link>

          {/* Connection Status Indicator */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-2.5 py-1"
            title={isConnected ? 'Live real-time updates active' : 'Connecting to real-time service...'}
          >
            <span
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate/50'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-mono text-[13px] uppercase tracking-wider transition-colors ${
                pathname === l.to ? 'text-rust font-semibold' : 'text-slate hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* Notification Bell */}
          <NotificationBell />

          {isAuthenticated ? (
            <div className="flex items-center gap-4 border-l border-ink/10 pl-4">
              <span className="font-mono text-xs font-semibold text-ink">{userFirstName}</span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/register"
              className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
            >
              Register now
            </Link>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center gap-3 md:hidden">
          <NotificationBell />
          <button
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 w-6 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-ink/10 px-6 py-6 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="font-mono text-sm uppercase tracking-wider text-ink"
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="flex flex-col gap-3 border-t border-ink/10 pt-4">
              <span className="font-mono text-sm font-semibold text-ink">{userFirstName}</span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-ink py-2 text-center text-sm font-semibold text-paper"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ink py-2 text-center text-sm font-semibold text-paper"
            >
              Register now
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
