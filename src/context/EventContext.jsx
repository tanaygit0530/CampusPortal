import { createContext, useContext, useState, useEffect } from 'react'
import useFetchEvents from '../hooks/useFetchEvents'
import {
  events as initialEvents,
  myRegistrations as initialRegistrations,
  initialEventRegistrants,
} from '../data/events'

const EventContext = createContext(null)

export function EventProvider({ children }) {
  const { events: fetchedEvents, loading: fetchLoading, error: fetchError, refetch } = useFetchEvents()
  const [events, setEvents] = useState(initialEvents)
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [eventRegistrants, setEventRegistrants] = useState(initialEventRegistrants)

  // Sync fetched events if available
  useEffect(() => {
    if (fetchedEvents && fetchedEvents.length > 0) {
      setEvents((prev) => {
        // Merge fetched with existing to preserve rich properties
        return fetchedEvents.map((fe) => {
          const existing = prev.find((e) => e.id === fe.id)
          return existing ? { ...existing, ...fe } : fe
        })
      })
    }
  }, [fetchedEvents])

  // --- MUTATION FUNCTIONS (Local State - Exp 4 Backend replaces this) ---

  const addEvent = (eventData) => {
    const newId = `EVT-${100 + events.length + 1}`
    const colors = ['amber', 'rust', 'ink']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newEvent = {
      id: newId,
      title: eventData.title,
      tagline: eventData.tagline || 'Exciting Campus Event',
      bannerUrl: eventData.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      description: eventData.description,
      category: eventData.category || 'Technical',
      date: eventData.date,
      time: eventData.time,
      registrationDeadline: eventData.registrationDeadline || eventData.date,
      venue: eventData.venue,
      mode: eventData.mode || 'On-campus',
      isTeamEvent: Boolean(eventData.isTeamEvent),
      minTeamSize: Number(eventData.minTeamSize || 1),
      maxTeamSize: Number(eventData.maxTeamSize || 1),
      eligibility: eventData.eligibility || 'Open to all',
      prizes: eventData.prizes || 'Certificates of Excellence',
      rules: eventData.rules || 'Follow standard campus guidelines.',
      contactName: eventData.contactName || 'Event Coordinator',
      contactEmail: eventData.contactEmail || 'events@college.edu',
      seatsTotal: Number(eventData.totalSeats),
      seatsLeft: Number(eventData.totalSeats),
      status: 'open',
      color: randomColor,
    }

    setEvents((prev) => [newEvent, ...prev])
    return newEvent
  }

  const updateEvent = (id, updatedData) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const seatsTotal = Number(updatedData.totalSeats ?? e.seatsTotal)
          const seatDiff = seatsTotal - e.seatsTotal
          const seatsLeft = Math.max(0, e.seatsLeft + seatDiff)
          return {
            ...e,
            ...updatedData,
            seatsTotal,
            seatsLeft,
            status: seatsLeft === 0 ? 'closed' : 'open',
          }
        }
        return e
      })
    )
  }

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setRegistrations((prev) => prev.filter((r) => r.id !== id))
    setEventRegistrants((prev) => prev.filter((r) => r.eventId !== id))
  }

  const registerForEvent = (eventId, payload = {}, user = null) => {
    const targetEvent = events.find((e) => e.id === eventId)
    if (!targetEvent || targetEvent.seatsLeft <= 0) return false

    const isAlready = registrations.some((r) => r.id === eventId)
    if (isAlready) return false

    // Add to student's registrations
    const newRegNo = `REG-${Math.floor(10000 + Math.random() * 90000)}`
    setRegistrations((prev) => [...prev, { id: eventId, status: 'Confirmed', regNo: newRegNo }])

    // Extract rich student info from payload or logged in user
    const studentName = payload.name || user?.name || 'Ananya Sharma'
    const studentEmail = payload.email || user?.email || 'ananya@college.edu'
    const phone = payload.phone || '9876543210'
    const department = payload.department || 'CS'
    const year = payload.year || '3rd'
    const teamName = payload.teamName || 'N/A'

    setEventRegistrants((prev) => [
      ...prev,
      {
        eventId,
        studentName,
        studentEmail,
        phone,
        department,
        year,
        teamName,
        registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Confirmed',
      },
    ])

    // Decrement seatsLeft on event
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const seatsLeft = e.seatsLeft - 1
          return {
            ...e,
            seatsLeft,
            status: seatsLeft === 0 ? 'closed' : 'open',
          }
        }
        return e
      })
    )

    return true
  }

  const cancelRegistration = (eventId) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== eventId))
    setEventRegistrants((prev) => prev.filter((r) => r.eventId !== eventId || r.studentEmail !== 'ananya@college.edu'))

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const seatsLeft = e.seatsLeft + 1
          return {
            ...e,
            seatsLeft,
            status: 'open',
          }
        }
        return e
      })
    )
  }

  const cancelStudentRegistration = (eventId, studentEmail) => {
    setEventRegistrants((prev) =>
      prev.filter((r) => !(r.eventId === eventId && r.studentEmail === studentEmail))
    )

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const seatsLeft = e.seatsLeft + 1
          return {
            ...e,
            seatsLeft,
            status: 'open',
          }
        }
        return e
      })
    )
  }

  const isEventRegistered = (eventId) => {
    return registrations.some((r) => r.id === eventId)
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
        addEvent,
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

export function useEvents() {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider')
  }
  return context
}

export default EventContext
