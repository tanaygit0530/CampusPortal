import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import useFetchEvents from '../hooks/useFetchEvents'
import api from '../api/axiosInstance'
import { useSocket } from './SocketContext'
import { useNotifications } from './NotificationContext'
import {
  events as initialEvents,
  myRegistrations as initialRegistrations,
  initialEventRegistrants,
} from '../data/events'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const { events: fetchedEvents, loading: fetchLoading, error: fetchError, refetch } = useFetchEvents()
  const { socket, isConnected, reconnectCount } = useSocket()
  const { addNotification } = useNotifications()

  const [events, setEvents] = useState(initialEvents)
  const [registrations, setRegistrations] = useState(
    initialRegistrations.map((r) => ({
      id: r.regNo || `REG-${Date.now()}`,
      eventId: r.id,
      studentEmail: 'ananya@college.edu',
      status: r.status ? r.status.toLowerCase() : 'confirmed',
      registeredAt: new Date().toISOString(),
    }))
  )
  const [eventRegistrants, setEventRegistrants] = useState(initialEventRegistrants)
  const [highlightedEventId, setHighlightedEventId] = useState(null)
  const [lastDeletedEventId, setLastDeletedEventId] = useState(null)
  const highlightTimerRef = useRef(null)

  // Trigger brief visual highlight animation for seat updates
  const triggerHighlight = useCallback((eventId) => {
    setHighlightedEventId(eventId)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedEventId(null)
    }, 2000)
  }, [])

  // Sync fetched events from initial API load
  useEffect(() => {
    if (fetchedEvents && fetchedEvents.length > 0) {
      setEvents((prev) => {
        return fetchedEvents.map((fe) => {
          const existing = prev.find((e) => e.id === fe.id || e._id === fe._id)
          return existing ? { ...existing, ...fe } : fe
        })
      })
    }
  }, [fetchedEvents])

  // Refetch events on socket reconnect to avoid missing updates
  useEffect(() => {
    if (reconnectCount > 1) {
      refetch?.()
    }
  }, [reconnectCount, refetch])

  // Real-Time Socket Event Listeners
  useEffect(() => {
    if (!socket) return

    // 1. New Event Created (Admin broadcast)
    const handleEventCreated = (data) => {
      const incoming = data.event
      if (!incoming) return
      const normalized = {
        id: incoming._id || incoming.id,
        _id: incoming._id || incoming.id,
        ...incoming,
        seatsTotal: incoming.totalSeats || incoming.seatsTotal,
        color: incoming.color || 'amber',
      }

      setEvents((prev) => {
        // Prevent duplicate if creator already added locally
        if (prev.some((e) => e.id === normalized.id || e._id === normalized._id)) {
          return prev
        }
        return [normalized, ...prev]
      })

      addNotification({
        type: 'event_created',
        title: 'New Event Added',
        message: data.message || `New event added: ${incoming.title}`,
      })
    }

    // 2. Event Updated
    const handleEventUpdated = (data) => {
      const incoming = data.event
      if (!incoming) return
      const targetId = incoming._id || incoming.id

      setEvents((prev) =>
        prev.map((e) => (e.id === targetId || e._id === targetId ? { ...e, ...incoming } : e))
      )

      addNotification({
        type: 'seats_updated',
        title: 'Event Updated',
        message: data.message || `Event updated: ${incoming.title}`,
      })
    }

    // 3. Event Deleted
    const handleEventDeleted = (data) => {
      const { eventId, title, message } = data
      setEvents((prev) => prev.filter((e) => e.id !== eventId && e._id !== eventId))
      setRegistrations((prev) => prev.filter((r) => r.eventId !== eventId))
      setEventRegistrants((prev) => prev.filter((r) => r.eventId !== eventId))
      setLastDeletedEventId(eventId)

      addNotification({
        type: 'event_deleted',
        title: 'Event Deleted',
        message: message || `Event "${title || 'Event'}" has been deleted.`,
      })
    }

    // 4. Live Seat Count Updates
    const handleSeatsUpdated = (data) => {
      const { eventId, seatsLeft, seatsTotal, isFull } = data
      triggerHighlight(eventId)

      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId || e._id === eventId) {
            return {
              ...e,
              seatsLeft,
              seatsTotal: seatsTotal !== undefined ? seatsTotal : e.seatsTotal,
              status: isFull ? 'closed' : 'open',
            }
          }
          return e
        })
      )
    }

    // 5. Low Seats Alert
    const handleLowSeats = (data) => {
      addNotification({
        type: 'low_seats',
        title: 'Seats Filling Fast!',
        message: data.message || `Hurry! Only ${data.seatsLeft} seats left for "${data.title}"!`,
      })
    }

    // 6. Admin Notifications (Registration / Cancellation alerts)
    const handleAdminNotification = (data) => {
      addNotification({
        type: 'admin_alert',
        title: 'Admin Activity',
        message: data.message,
      })
    }

    // 7. Live Registrant Added (Admin Registrants Table)
    const handleRegistrationCreated = (data) => {
      if (!data?.registration) return
      setEventRegistrants((prev) => {
        // Prevent duplicate
        if (prev.some((r) => r.id === data.registration.id || r._id === data.registration._id)) {
          return prev
        }
        return [data.registration, ...prev]
      })
    }

    // 8. Live Registrant Removed (Admin Registrants Table)
    const handleRegistrationCancelled = (data) => {
      const { registrationId, eventId, studentEmail } = data
      setEventRegistrants((prev) =>
        prev.filter((r) => {
          if (registrationId && (r.id === registrationId || r._id === registrationId)) return false
          if (eventId && studentEmail && r.eventId === eventId && r.studentEmail === studentEmail) {
            return false
          }
          return true
        })
      )
    }

    socket.on('event:created', handleEventCreated)
    socket.on('event:updated', handleEventUpdated)
    socket.on('event:deleted', handleEventDeleted)
    socket.on('event:seatsUpdated', handleSeatsUpdated)
    socket.on('event:lowSeats', handleLowSeats)
    socket.on('admin:notification', handleAdminNotification)
    socket.on('registration:created', handleRegistrationCreated)
    socket.on('registration:cancelled', handleRegistrationCancelled)

    return () => {
      socket.off('event:created', handleEventCreated)
      socket.off('event:updated', handleEventUpdated)
      socket.off('event:deleted', handleEventDeleted)
      socket.off('event:seatsUpdated', handleSeatsUpdated)
      socket.off('event:lowSeats', handleLowSeats)
      socket.off('admin:notification', handleAdminNotification)
      socket.off('registration:created', handleRegistrationCreated)
      socket.off('registration:cancelled', handleRegistrationCancelled)
    }
  }, [socket, addNotification, triggerHighlight])

  const createEvent = async (eventData) => {
    const seatsCount = Number(eventData.totalSeats || eventData.seatsTotal || 100)
    const newEventLocal = {
      id: `EVT-${Date.now()}`,
      title: eventData.title,
      description: eventData.description || eventData.title,
      category: eventData.category || 'Technical',
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue,
      totalSeats: seatsCount,
      seatsTotal: seatsCount,
      seatsLeft: seatsCount,
      status: 'open',
      color: 'amber',
      ...eventData,
    }

    setEvents((prev) => [newEventLocal, ...prev])

    try {
      const response = await api.post('/events', {
        title: eventData.title,
        description: eventData.description || eventData.title,
        category: eventData.category || 'Technical',
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        totalSeats: seatsCount,
        seatsLeft: seatsCount,
        status: 'open',
      })
      const saved = response.data
      const dbEvent = { id: saved._id, _id: saved._id, ...saved, seatsTotal: saved.totalSeats }
      setEvents((prev) => prev.map((e) => (e.id === newEventLocal.id ? dbEvent : e)))
      return dbEvent
    } catch (err) {
      console.warn('Saved locally (MongoDB API fallback):', err?.message)
      return newEventLocal
    }
  }

  const updateEvent = async (id, updates) => {
    setEvents((prev) => prev.map((e) => (e.id === id || e._id === id ? { ...e, ...updates } : e)))
    try {
      if (id && !id.startsWith('EVT-')) {
        await api.put(`/events/${id}`, updates)
      }
    } catch (err) {
      console.warn('API update event error:', err.message)
    }
  }

  const deleteEvent = async (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id && e._id !== id))
    setRegistrations((prev) => prev.filter((r) => r.eventId !== id))
    setEventRegistrants((prev) => prev.filter((r) => r.eventId !== id))
    try {
      if (id && !id.startsWith('EVT-')) {
        await api.delete(`/events/${id}`)
      }
    } catch (err) {
      console.warn('API delete event error:', err.message)
    }
  }

  const registerForEvent = async (eventId, studentEmail, formData = {}) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId || e._id === eventId
          ? { ...e, seatsLeft: Math.max(0, e.seatsLeft - 1) }
          : e
      )
    )
    const newReg = {
      id: `REG-${Date.now()}`,
      eventId,
      studentEmail: studentEmail || 'ananya@college.edu',
      status: 'confirmed',
      registeredAt: new Date().toISOString(),
      ...formData,
    }
    setRegistrations((prev) => [...prev, newReg])

    setEventRegistrants((prev) => [
      ...prev,
      {
        eventId,
        studentName: formData.name || 'Ananya Sharma',
        studentEmail: studentEmail || 'ananya@college.edu',
        phone: formData.phone || '9876543210',
        department: formData.department || 'CS',
        year: formData.year || '3rd',
        teamName: formData.teamName || 'N/A',
        registeredAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'Confirmed',
      },
    ])

    // Save to MongoDB API in background
    try {
      let studentId = null
      let targetEventId = eventId

      // Find student user _id
      const usersRes = await api.get('/users')
      const matchingUser = usersRes.data.find((u) => u.email === studentEmail)
      if (matchingUser) {
        studentId = matchingUser._id
      } else {
        const createdUser = await api.post('/users', {
          name: formData.name || 'Student User',
          email: studentEmail || 'student@college.edu',
          password: 'password123',
          role: 'student',
        })
        studentId = createdUser.data._id
      }

      // Find event _id
      const eventsRes = await api.get('/events')
      if (eventsRes.data.length > 0) {
        const matchingEvent = eventsRes.data.find(
          (e) => e._id === eventId || e.title === formData.eventTitle
        )
        targetEventId = matchingEvent ? matchingEvent._id : eventsRes.data[0]._id
      }

      if (studentId && targetEventId) {
        const regRes = await api.post('/registrations', {
          event: targetEventId,
          student: studentId,
          status: 'confirmed',
        })
        newReg.mongoId = regRes.data._id
      }
    } catch (dbErr) {
      console.warn('MongoDB Registration API notice:', dbErr.message)
    }

    return newReg
  }

  const cancelRegistration = async (registrationId) => {
    const reg = registrations.find((r) => r.id === registrationId || r.eventId === registrationId)
    if (!reg) return
    const targetEventId = reg.eventId || registrationId

    setEvents((prev) =>
      prev.map((e) => (e.id === targetEventId ? { ...e, seatsLeft: e.seatsLeft + 1 } : e))
    )
    setRegistrations((prev) => prev.filter((r) => r.id !== reg.id && r.eventId !== targetEventId))
    setEventRegistrants((prev) =>
      prev.filter((r) => r.eventId !== targetEventId || r.studentEmail !== reg.studentEmail)
    )

    // Call DELETE /api/registrations/:id if mongoId exists
    if (reg.mongoId) {
      try {
        await api.delete(`/registrations/${reg.mongoId}`)
      } catch (err) {
        console.warn('Backend cancel registration notice:', err.message)
      }
    }
  }

  const cancelStudentRegistration = async (eventId, studentEmail) => {
    setEventRegistrants((prev) =>
      prev.filter((r) => !(r.eventId === eventId && r.studentEmail === studentEmail))
    )
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, seatsLeft: e.seatsLeft + 1 } : e))
    )
  }

  const isEventRegistered = (eventId, studentEmail) => {
    return registrations.some(
      (r) => r.eventId === eventId && (!studentEmail || r.studentEmail === studentEmail)
    )
  }

  return (
    <EventContext.Provider
      value={{
        events,
        loading: fetchLoading && events.length === 0,
        error: fetchError,
        refetch,
        registrations,
        eventRegistrants,
        highlightedEventId,
        lastDeletedEventId,
        createEvent,
        addEvent: createEvent,
        updateEvent,
        deleteEvent,
        registerForEvent,
        cancelRegistration,
        cancelStudentRegistration,
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
      loading: false,
      error: null,
      refetch: () => {},
      registrations: [],
      eventRegistrants: [],
      highlightedEventId: null,
      lastDeletedEventId: null,
      createEvent: () => ({}),
      addEvent: () => ({}),
      updateEvent: () => {},
      deleteEvent: () => {},
      registerForEvent: () => ({}),
      cancelRegistration: () => {},
      cancelStudentRegistration: () => {},
      isEventRegistered: () => false,
    }
  }
  return context
}

export default EventContext
