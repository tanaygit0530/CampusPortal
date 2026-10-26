import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axiosInstance'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const { user, token } = useAuth()
  const { socket, reconnectCount } = useSocket()
  const { addNotification } = useNotifications()

  // STRICT ZERO DUMMY DATA: All initial states empty, populated solely from MongoDB API
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    openEvents: 0,
    totalRegistrations: 0,
    totalSeats: 0,
    seatsFilled: 0,
    seatsFilledPercentage: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [highlightedEventId, setHighlightedEventId] = useState(null)
  const [lastDeletedEventId, setLastDeletedEventId] = useState(null)
  const highlightTimerRef = useRef(null)

  // Trigger visual highlight animation on cards when live seat changes occur
  const triggerHighlight = useCallback((eventId) => {
    setHighlightedEventId(eventId)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedEventId(null)
    }, 2000)
  }, [])

  // Fetch all public events from MongoDB
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events')
      setEvents(res.data || [])
      return res.data
    } catch (err) {
      console.error('Failed to load events from backend:', err.message)
      throw err
    }
  }, [])

  // Fetch real statistics from /api/stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/stats')
      if (res.data) {
        setStats(res.data)
      }
    } catch (err) {
      console.warn('Failed to load live stats:', err.message)
    }
  }, [])

  // Fetch logged-in student's registrations
  const fetchMyRegistrations = useCallback(async () => {
    if (!token || user?.role !== 'student') {
      setRegistrations([])
      return
    }
    try {
      const res = await api.get('/registrations/my')
      setRegistrations(res.data || [])
    } catch (err) {
      console.warn('Failed to load registrations:', err.message)
    }
  }, [token, user?.role])

  // Unified load function for initial mount and retry
  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.allSettled([fetchEvents(), fetchStats(), fetchMyRegistrations()])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [fetchEvents, fetchStats, fetchMyRegistrations])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Refetch on socket reconnection so client never misses data
  useEffect(() => {
    if (reconnectCount > 1) {
      console.log('[Real-time] Reconnected to server: refetching live data')
      loadAllData()
    }
  }, [reconnectCount, loadAllData])

  // Socket.IO Real-Time Listeners
  useEffect(() => {
    if (!socket) return

    // 1. Live stats broadcast
    const handleStatsUpdated = (newStats) => {
      if (newStats) setStats(newStats)
    }

    // 2. New event created
    const handleEventCreated = (data) => {
      const incoming = data.event
      if (!incoming) return
      setEvents((prev) => {
        const id = incoming._id || incoming.id
        if (prev.some((e) => (e._id || e.id) === id)) return prev
        return [incoming, ...prev]
      })
      addNotification({
        type: 'event_created',
        title: 'New Event Added',
        message: data.message || `New event: "${incoming.title}"`,
      })
    }

    // 3. Event updated
    const handleEventUpdated = (data) => {
      const incoming = data.event
      if (!incoming) return
      const targetId = incoming._id || incoming.id
      setEvents((prev) =>
        prev.map((e) => ((e._id || e.id) === targetId ? { ...e, ...incoming } : e))
      )
      addNotification({
        type: 'seats_updated',
        title: 'Event Updated',
        message: data.message || `Event "${incoming.title}" was updated.`,
      })
    }

    // 4. Event deleted
    const handleEventDeleted = (data) => {
      const { eventId, title, message } = data
      setEvents((prev) => prev.filter((e) => (e._id || e.id) !== eventId))
      setRegistrations((prev) =>
        prev.filter((r) => (r.event?._id || r.event || r.eventId) !== eventId)
      )
      setLastDeletedEventId(eventId)
      addNotification({
        type: 'event_deleted',
        title: 'Event Deleted',
        message: message || `Event "${title || 'Event'}" was removed.`,
      })
    }

    // 5. Atomic Seat Count Updated
    const handleSeatsUpdated = (data) => {
      const { eventId, seatsLeft, seatsTotal, status, isFull } = data
      triggerHighlight(eventId)

      setEvents((prev) =>
        prev.map((e) => {
          if ((e._id || e.id) === eventId) {
            return {
              ...e,
              seatsLeft,
              totalSeats: seatsTotal !== undefined ? seatsTotal : e.totalSeats,
              status: status || (isFull ? 'closed' : e.status),
            }
          }
          return e
        })
      )
    }

    // 6. Admin Notifications (Registration / Cancellation alerts)
    const handleAdminNotification = (data) => {
      addNotification({
        type: 'admin_alert',
        title: data.type === 'registration' ? 'New Registration' : 'Registration Cancelled',
        message: data.message,
      })
    }

    // 7. Student Personal Room: Registration Added
    const handleMyRegistrationAdded = (reg) => {
      setRegistrations((prev) => {
        if (prev.some((r) => (r._id || r.id) === (reg._id || reg.id))) return prev
        return [reg, ...prev]
      })
      addNotification({
        type: 'registration_confirmed',
        title: 'Registration Confirmed',
        message: `You are registered for "${reg.event?.title || 'the event'}"!`,
      })
    }

    // 8. Student Personal Room: Registration Cancelled
    const handleMyRegistrationCancelled = (data) => {
      setRegistrations((prev) =>
        prev.map((r) => {
          if ((r._id || r.id) === data.registrationId) {
            return { ...r, status: 'cancelled' }
          }
          return r
        })
      )
      if (data.message) {
        addNotification({
          type: 'cancellation_notice',
          title: 'Registration Update',
          message: data.message,
        })
      }
    }

    socket.on('stats:updated', handleStatsUpdated)
    socket.on('event:created', handleEventCreated)
    socket.on('event:updated', handleEventUpdated)
    socket.on('event:deleted', handleEventDeleted)
    socket.on('event:seatsUpdated', handleSeatsUpdated)
    socket.on('admin:notification', handleAdminNotification)
    socket.on('myRegistration:added', handleMyRegistrationAdded)
    socket.on('myRegistration:cancelled', handleMyRegistrationCancelled)

    return () => {
      socket.off('stats:updated', handleStatsUpdated)
      socket.off('event:created', handleEventCreated)
      socket.off('event:updated', handleEventUpdated)
      socket.off('event:deleted', handleEventDeleted)
      socket.off('event:seatsUpdated', handleSeatsUpdated)
      socket.off('admin:notification', handleAdminNotification)
      socket.off('myRegistration:added', handleMyRegistrationAdded)
      socket.off('myRegistration:cancelled', handleMyRegistrationCancelled)
    }
  }, [socket, addNotification, triggerHighlight])

  // Actions connecting to real backend API
  const createEvent = async (eventData) => {
    const response = await api.post('/events', eventData)
    const newEvent = response.data
    setEvents((prev) => {
      if (prev.some((e) => (e._id || e.id) === (newEvent._id || newEvent.id))) return prev
      return [newEvent, ...prev]
    })
    await fetchStats()
    return newEvent
  }

  const updateEvent = async (id, updates) => {
    const response = await api.put(`/events/${id}`, updates)
    const updated = response.data
    setEvents((prev) =>
      prev.map((e) => ((e._id || e.id) === id ? { ...e, ...updated } : e))
    )
    await fetchStats()
    return updated
  }

  const deleteEvent = async (id) => {
    await api.delete(`/events/${id}`)
    setEvents((prev) => prev.filter((e) => (e._id || e.id) !== id))
    setRegistrations((prev) =>
      prev.filter((r) => (r.event?._id || r.event || r.eventId) !== id)
    )
    await fetchStats()
  }

  const registerForEvent = async (eventId, registrationData) => {
    const response = await api.post('/registrations', {
      event: eventId,
      ...registrationData,
    })
    const newReg = response.data
    setRegistrations((prev) => {
      if (prev.some((r) => (r._id || r.id) === (newReg._id || newReg.id))) return prev
      return [newReg, ...prev]
    })
    // Update local event seat count immediately
    setEvents((prev) =>
      prev.map((e) =>
        (e._id || e.id) === eventId
          ? {
              ...e,
              seatsLeft: Math.max(0, (e.seatsLeft ?? e.totalSeats) - 1),
              status: (e.seatsLeft ?? e.totalSeats) - 1 <= 0 ? 'closed' : e.status,
            }
          : e
      )
    )
    await fetchStats()
    return newReg
  }

  const cancelRegistration = async (registrationId) => {
    const response = await api.delete(`/registrations/my/${registrationId}`)
    setRegistrations((prev) =>
      prev.map((r) =>
        (r._id || r.id) === registrationId ? { ...r, status: 'cancelled' } : r
      )
    )
    await fetchStats()
    return response.data
  }

  const isEventRegistered = (eventId) => {
    return registrations.some((r) => {
      const regEventId = r.event?._id || r.event || r.eventId
      return regEventId === eventId && r.status === 'confirmed'
    })
  }

  return (
    <EventContext.Provider
      value={{
        events,
        stats,
        registrations,
        loading,
        error,
        refetch: loadAllData,
        highlightedEventId,
        lastDeletedEventId,
        createEvent,
        addEvent: createEvent,
        updateEvent,
        deleteEvent,
        registerForEvent,
        cancelRegistration,
        isEventRegistered,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export const useEvents = () => {
  const context = useContext(EventContext)
  if (!context) {
    return {
      events: [],
      stats: {
        totalEvents: 0,
        openEvents: 0,
        totalRegistrations: 0,
        totalSeats: 0,
        seatsFilled: 0,
        seatsFilledPercentage: 0,
      },
      registrations: [],
      loading: false,
      error: null,
      refetch: () => {},
      highlightedEventId: null,
      lastDeletedEventId: null,
      createEvent: async () => ({}),
      addEvent: async () => ({}),
      updateEvent: async () => ({}),
      deleteEvent: async () => ({}),
      registerForEvent: async () => ({}),
      cancelRegistration: async () => ({}),
      isEventRegistered: () => false,
    }
  }
  return context
}

export default EventContext
