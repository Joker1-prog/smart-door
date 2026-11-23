import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

const STATUS_INTERVAL_MS = 2000
const EVENTS_INTERVAL_MS = 5000

export function useDashboard() {
  const [status, setStatus] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(true)
  const mounted = useRef(true)

  const refreshStatus = useCallback(async () => {
    try {
      const data = await api.getStatus()
      if (!mounted.current) return
      setStatus(data)
      setBackendOnline(true)
    } catch (error) {
      if (mounted.current) setBackendOnline(false)
      throw error
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const refreshEvents = useCallback(async () => {
    try {
      const data = await api.getEvents(20)
      if (mounted.current) setEvents(data.events || [])
    } catch {
      // L'état de connexion est géré par refreshStatus.
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    refreshStatus().catch(() => {})
    refreshEvents()

    const statusTimer = setInterval(() => refreshStatus().catch(() => {}), STATUS_INTERVAL_MS)
    const eventsTimer = setInterval(refreshEvents, EVENTS_INTERVAL_MS)

    return () => {
      mounted.current = false
      clearInterval(statusTimer)
      clearInterval(eventsTimer)
    }
  }, [refreshStatus, refreshEvents])

  return { status, events, loading, backendOnline, refreshStatus, refreshEvents }
}
