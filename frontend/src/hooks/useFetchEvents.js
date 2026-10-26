import { useState, useEffect, useCallback } from 'react'
import api from '../api/axiosInstance'

export default function useFetchEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/events')
      setEvents(response.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { events, loading, error, refetch: loadEvents }
}
