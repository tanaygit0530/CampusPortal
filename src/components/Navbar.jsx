import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/login', label: 'Log in' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-lg text-amber">
            C
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Campus<span className="text-rust">Pass</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-mono text-[13px] uppercase tracking-wider transition-colors ${
                pathname === l.to ? 'text-rust' : 'text-slate hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
          >
            Register now
          </Link>
        </div>

        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-6 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-ink transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

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
        </div>
      )}
    </header>
  )
}
