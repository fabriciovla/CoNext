import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut, apiUpload } from '../api/client'

// El material con el que se entrena un agente. Las fuentes son del negocio y el
// interruptor es de cada agente, así que esto pide siempre la lista completa:
// lo que cambia entre un agente y otro es cuáles vienen encendidas.
//
// Sin `agentId` —la pantalla de un agente que todavía no se creó— no hay a quién
// preguntarle, así que queda vacío y en silencio: no es un error, es que todavía
// no hay agente.
export default function useAgentKnowledge(agentId) {
  const [fuentes, setFuentes] = useState([])
  const [cargando, setCargando] = useState(Boolean(agentId))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const refrescar = useCallback(async () => {
    if (!agentId) return []
    const lista = await apiGet(`/agents/${agentId}/knowledge`)
    setFuentes(lista)
    return lista
  }, [agentId])

  useEffect(() => {
    if (!agentId) {
      setFuentes([])
      setCargando(false)
      return
    }
    setCargando(true)
    refrescar()
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, [agentId, refrescar])

  // Leer un PDF o abrir una página tarda, y puede fallar por algo que se puede
  // arreglar (el archivo no tiene texto, la página pide contraseña). Por eso el
  // alta devuelve la promesa: el modal la espera y muestra el error adentro, en
  // vez de cerrarse y dejar el aviso en otro lado de la pantalla.
  const alAgregar = (promesa) => {
    setGuardando(true)
    setError(null)
    return promesa
      .then(async (fuente) => {
        await refrescar()
        return fuente
      })
      .catch((err) => {
        setError(err.message)
        throw err
      })
      .finally(() => setGuardando(false))
  }

  const agregarArchivo = (file, title) => {
    const datos = new FormData()
    datos.append('file', file)
    // El título va aparte del archivo: si la pantalla no manda ninguno, el
    // server usa el nombre del archivo.
    if (title) datos.append('title', title)
    if (agentId) datos.append('agentId', agentId)
    return alAgregar(apiUpload('/agents/knowledge', datos))
  }

  const agregarEnlace = (url, title) =>
    alAgregar(apiPost('/agents/knowledge', { kind: 'enlace', url, title, agentId }))

  const agregarTexto = (title, content) =>
    alAgregar(apiPost('/agents/knowledge', { kind: 'texto', title, content, agentId }))

  // El interruptor es optimista, como las etiquetas de la bandeja: esperar la
  // vuelta del server para ver moverse la palanca que acabás de tocar se siente
  // roto. Si falla, vuelve a donde estaba y se dice por qué.
  const alternar = (sourceId, enabled) => {
    setFuentes((prev) => prev.map((f) => (f.id === sourceId ? { ...f, enabled } : f)))
    return apiPut(`/agents/${agentId}/knowledge/${sourceId}`, { enabled }).catch((err) => {
      setFuentes((prev) => prev.map((f) => (f.id === sourceId ? { ...f, enabled: !enabled } : f)))
      setError(err.message)
      throw err
    })
  }

  const borrar = (sourceId) =>
    apiDelete(`/agents/knowledge/${sourceId}`)
      .then(refrescar)
      .catch((err) => {
        setError(err.message)
        throw err
      })

  return {
    fuentes,
    cargando,
    guardando,
    error,
    limpiarError: () => setError(null),
    agregarArchivo,
    agregarEnlace,
    agregarTexto,
    alternar,
    borrar,
  }
}
