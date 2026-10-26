import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications()
  const dropdownRef = useRef(null)

  const handleToggle = () => {
    if (!isOpen) {
      markAllAsRead()
    }
    setIsOpen((prev) => !prev)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-paper transition-colors hover:bg-paper-dim focus:outline-none"
        aria-label="Notifications"
        title="Session Notifications"
      >
        <svg
          className="h-4.5 w-4.5 text-ink"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rust px-1 font-mono text-[10px] font-bold text-paper shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute -right-8 sm:right-0 mt-2 w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 rounded-2xl border border-ink/10 bg-white p-4 shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold text-ink">Live Notifications</span>
              <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-slate">
                {notifications.length}
              </span>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="font-mono text-[11px] text-slate hover:text-rust transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto flex flex-col gap-2 divide-y divide-ink/5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-2xl">🔔</span>
                <p className="mt-2 font-display text-sm text-slate">No notifications yet</p>
                <p className="font-body text-xs text-slate/70">
                  Real-time events will appear here live.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-xs font-semibold text-ink">{item.title}</p>
                    <span className="font-mono text-[10px] text-slate/60 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 font-body text-xs text-slate leading-relaxed">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
