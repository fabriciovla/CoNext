import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

// Las métricas cambian solas cuando entran mensajes (el pipeline las escribe
// del lado del server), así que se refrescan cada tanto igual que la bandeja.
const STATS_POLL_MS = 15000

export default function useAgents() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({})
  const [error, setError] = useState(null)
  // Ver el comentario de `useProducts`: la lista vacía del arranque no es lo
  // mismo que un cliente sin agentes.
  const [cargando, setCargando] = useState(true)

  const refreshStats = useCallback(async () => {
    setStats(await apiGet('/agents/stats'))
  }, [])

  useEffect(() => {
    apiGet('/agents')
      .then(setAgents)
      .catch((err) => console.error('[useAgents]', err))
      .finally(() => setCargando(false))
    refreshStats().catch((err) => console.error('[useAgents] stats', err))

    const interval = setInterval(() => {
      if (document.hidden) return
      refreshStats().catch((err) => console.error('[useAgents] poll stats', err))
    }, STATS_POLL_MS)

    return () => clearInterval(interval)
  }, [refreshStats])

  const addAgent = (agent) =>
    apiPost('/agents', agent)
      .then((created) => {
        setAgents((prev) => [...prev, created])
        setError(null)
        return created
      })
      .catch((err) => {
        setError(err.message)
        throw err
      })

  const updateAgent = (id, changes) =>
    apiPut(`/agents/${id}`, changes)
      .then((updated) => {
        setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)))
        setError(null)
        return updated
      })
      .catch((err) => {
        setError(err.message)
        throw err
      })

  const deleteAgent = (id) =>
    apiDelete(`/agents/${id}`)
      .then(() => {
        setAgents((prev) => prev.filter((a) => a.id !== id))
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        throw err
      })

  // El orden define el agente de respaldo (el primero activo), así que se
  // reordena entero y el server reescribe las posiciones de una.
  const reorderAgents = (ids) => {
    setAgents((prev) => ids.map((id) => prev.find((a) => a.id === id)).filter(Boolean))
    return apiPost('/agents/reorder', { ids })
      .then(setAgents)
      .catch((err) => {
        setError(err.message)
        throw err
      })
  }

  return { agents, stats, cargando, error, addAgent, updateAgent, deleteAgent, reorderAgents }
}
