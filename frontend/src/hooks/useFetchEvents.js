import { useState, useEffect, useCallback } from 'react'
import { fetchEventsApi } from '../api/eventsApi'

export default function useFetchEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchEventsApi()
      setEvents(response.data)
    } catch (err) {
      setError(err.message || 'Something went wrong while loading events.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { events, loading, error, refetch: loadEvents }
}
