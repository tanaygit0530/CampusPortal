import { createContext, useContext, useState, useEffect } from 'react'
import useFetchEvents from '../hooks/useFetchEvents'
import api from '../api/axiosInstance'
import {
  events as initialEvents,
  myRegistrations as initialRegistrations,
  initialEventRegistrants,
} from '../data/events'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const { events: fetchedEvents, loading: fetchLoading, error: fetchError, refetch } = useFetchEvents()
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

  useEffect(() => {
    if (fetchedEvents && fetchedEvents.length > 0) {
      setEvents((prev) => {
        return fetchedEvents.map((fe) => {
          const existing = prev.find((e) => e.id === fe.id)
          return existing ? { ...existing, ...fe } : fe
        })
      })
    }
  }, [fetchedEvents])

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
      prev.map((e) => (e.id === eventId || e._id === eventId ? { ...e, seatsLeft: Math.max(0, e.seatsLeft - 1) } : e))
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
        registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
        const matchingEvent = eventsRes.data.find((e) => e._id === eventId || e.title === formData.eventTitle)
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

  // cancelRegistration — student cancels
  // TODO (Exp 4): replace with DELETE /api/registrations/:id
  const cancelRegistration = (registrationId) => {
    const reg = registrations.find((r) => r.id === registrationId || r.eventId === registrationId)
    if (!reg) return
    const targetEventId = reg.eventId || registrationId

    setEvents((prev) =>
      prev.map((e) => (e.id === targetEventId ? { ...e, seatsLeft: e.seatsLeft + 1 } : e))
    )
    setRegistrations((prev) => prev.filter((r) => r.id !== reg.id && r.eventId !== targetEventId))
    setEventRegistrants((prev) => prev.filter((r) => r.eventId !== targetEventId || r.studentEmail !== reg.studentEmail))
  }

  const cancelStudentRegistration = (eventId, studentEmail) => {
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
