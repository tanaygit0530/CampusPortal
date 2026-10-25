import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Remove toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Add notification & toast
  const addNotification = useCallback(
    ({ type = 'info', title = 'Notification', message = '', duration = 4500 }) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const newNotif = {
        id,
        type,
        title,
        message,
        timestamp,
        read: false,
      }

      // Add to session notifications list for the bell dropdown
      setNotifications((prev) => [newNotif, ...prev.slice(0, 24)])
      setUnreadCount((c) => c + 1)

      // Add to active toasts
      setToasts((prev) => [...prev, newNotif])

      // Auto-dismiss toast
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        notifications,
        unreadCount,
        addNotification,
        removeToast,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

export default NotificationContext
