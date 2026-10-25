import { useNotifications } from '../context/NotificationContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useNotifications()

  if (!toasts || toasts.length === 0) return null

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'event_created':
        return 'border-amber/40 bg-ink text-amber'
      case 'seats_updated':
        return 'border-amber/30 bg-ink text-amber'
      case 'low_seats':
        return 'border-rust/50 bg-ink text-rust'
      case 'event_deleted':
        return 'border-rust/50 bg-ink text-rust'
      case 'admin_alert':
        return 'border-amber/50 bg-ink text-amber'
      default:
        return 'border-ink/20 bg-ink text-paper'
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'event_created':
        return '✨'
      case 'low_seats':
        return '⚠️'
      case 'event_deleted':
        return '🗑️'
      case 'admin_alert':
        return '🛡️'
      case 'seats_updated':
        return '⚡'
      default:
        return '📢'
    }
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm w-full flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur transition-all duration-300 animate-slide-in ${getBadgeStyle(
            toast.type
          )}`}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper/10 text-base">
              {getIcon(toast.type)}
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-paper leading-tight">
                {toast.title}
              </p>
              <p className="mt-1 font-body text-xs text-paper/80 leading-snug">
                {toast.message}
              </p>
              <span className="mt-1.5 block font-mono text-[10px] text-paper/50">
                {toast.timestamp}
              </span>
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-full p-1 text-paper/50 hover:text-paper hover:bg-paper/10 transition-colors"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
