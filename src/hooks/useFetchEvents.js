import { useState, useEffect, useCallback } from 'react'
import { fetchEventsApi } from '../api/eventsApi'

// Reusable data-fetching hook — demonstrates useEffect handling a side effect
// (an async API call) plus loading/error state that any component can consume
// just by calling useFetchEvents(). This is the same pattern axios.get()
// would follow once the real Express API exists (Exp 4).
export default function useFetchEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchEventsApi() // axios-style: { data: [...] }
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
