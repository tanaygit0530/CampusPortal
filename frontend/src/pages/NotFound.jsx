import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="font-mono text-sm uppercase tracking-[0.2em] text-rust font-semibold">
        404 — Page Not Found
      </span>
      <h1 className="mt-4 font-display text-5xl font-semibold text-ink sm:text-6xl">
        Lost on campus?
      </h1>
      <p className="mt-4 max-w-md font-body text-base text-slate leading-relaxed">
        The pass or destination you are trying to visit does not exist, has expired, or was relocated.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="rounded-full bg-ink px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:bg-ink-light"
        >
          Return Home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-full border border-ink/20 px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          Browse Events
        </Link>
      </div>
    </div>
  )
}
