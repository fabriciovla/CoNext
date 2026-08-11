import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../api/client'

const POLL_MS = 6000

// Backed by the server now: `messages` is GET /messages?day=open, refreshed
// on an interval so webhook-driven incoming messages show up without a
// reload. Mutations (send/resolve/note/assign) fire the request and then
// re-pull the affected slice rather than trying to hand-patch local state,
// since the AI pipeline can also change things (auto-replies, drafts)
// server-side between our own actions.
export default function useMessages() {
  const [messages, setMessages] = useState([])
  const [archivedDays, setArchivedDays] = useState([])
  const [conversationsMeta, setConversationsMeta] = useState({})
  const [drafts, setDrafts] = useState({})
  // Responsable por teléfono: reflejo local optimista de lo que ya se mandó
  // a PATCH /conversations/:phone/assignee (conversationsMeta trae lo mismo
  // un poco más tarde, en el próximo poll).
  const [assignments, setAssignments] = useState({})
  const [dayStatus, setDayStatus] = useState('closed')
  const [dayOpenedAt, setDayOpenedAt] = useState(null)
  const [dayClosedAt, setDayClosedAt] = useState(null)

  const refreshDay = useCallback(async () => {
    const day = await apiGet('/days/current')
    setDayStatus(day.status)
    setDayOpenedAt(day.openedAt)
    setDayClosedAt(day.closedAt)
  }, [])

  const refreshOpenMessages = useCallback(async () => {
    setMessages(await apiGet('/messages?day=open'))
  }, [])

  const refreshArchivedDays = useCallback(async () => {
    setArchivedDays(await apiGet('/days?status=closed'))
  }, [])

  const refreshMeta = useCallback(async () => {
    setConversationsMeta(await apiGet('/conversations/meta'))
  }, [])

  const refreshDrafts = useCallback(async () => {
    setDrafts(await apiGet('/conversations/drafts?day=open'))
  }, [])

  useEffect(() => {
    Promise.all([refreshDay(), refreshOpenMessages(), refreshArchivedDays(), refreshMeta(), refreshDrafts()]).catch(
      (err) => console.error('[useMessages] initial load', err),
    )

    const interval = setInterval(() => {
      if (document.hidden) return
      refreshOpenMessages().catch((err) => console.error('[useMessages] poll messages', err))
      refreshDrafts().catch((err) => console.error('[useMessages] poll drafts', err))
      refreshMeta().catch((err) => console.error('[useMessages] poll meta', err))
    }, POLL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolveConversation = (phone) => {
    if (dayStatus !== 'open') return
    apiPatch(`/conversations/${encodeURIComponent(phone)}/resolve`)
      .then(refreshOpenMessages)
      .catch((err) => console.error('[useMessages] resolveConversation', err))
  }

  const sendMessage = (phone, text) => {
    const body = text.trim()
    if (dayStatus !== 'open' || !body) return
    apiPost('/messages', { phone, text: body })
      .then(() => Promise.all([refreshOpenMessages(), refreshDrafts()]))
      .catch((err) => console.error('[useMessages] sendMessage', err))
  }

  const addNote = (phone, text) => {
    const body = text.trim()
    if (dayStatus !== 'open' || !body) return
    apiPost(`/conversations/${encodeURIComponent(phone)}/notes`, { text: body })
      .then(refreshOpenMessages)
      .catch((err) => console.error('[useMessages] addNote', err))
  }

  // `user` en null deja la conversación sin asignar, que es un estado válido
  // (la carpeta "Sin asignar" es justamente la que el equipo mira primero).
  const assignConversation = (phone, user) => {
    setAssignments((prev) => ({ ...prev, [phone]: user }))
    apiPatch(`/conversations/${encodeURIComponent(phone)}/assignee`, { assignee: user })
      .then(refreshMeta)
      .catch((err) => console.error('[useMessages] assignConversation', err))
  }

  // Reasignar el agente a mano: pisa lo que decidió el ruteador y es lo que va
  // a usar el pipeline para los próximos mensajes de esta conversación.
  const changeConversationAgent = (phone, agentKey) => {
    setConversationsMeta((prev) => ({
      ...prev,
      [phone]: { ...prev[phone], agent: agentKey },
    }))
    apiPatch(`/conversations/${encodeURIComponent(phone)}/agent`, { agent: agentKey })
      .then(refreshMeta)
      .catch((err) => console.error('[useMessages] changeConversationAgent', err))
  }

  // Etiquetas libres de la conversación. Se actualiza el estado local primero
  // porque etiquetar es una acción de un click y esperar el próximo poll para
  // ver el chip aparecer se siente roto.
  const addConversationTag = (phone, tag) => {
    const clean = String(tag ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
    if (!clean) return
    setConversationsMeta((prev) => {
      const actuales = prev[phone]?.tags ?? []
      if (actuales.includes(clean)) return prev
      return { ...prev, [phone]: { ...prev[phone], tags: [...actuales, clean] } }
    })
    apiPost(`/conversations/${encodeURIComponent(phone)}/tags`, { tag: clean })
      .then(refreshMeta)
      .catch((err) => console.error('[useMessages] addConversationTag', err))
  }

  const removeConversationTag = (phone, tag) => {
    setConversationsMeta((prev) => ({
      ...prev,
      [phone]: { ...prev[phone], tags: (prev[phone]?.tags ?? []).filter((t) => t !== tag) },
    }))
    apiDelete(`/conversations/${encodeURIComponent(phone)}/tags/${encodeURIComponent(tag)}`)
      .then(refreshMeta)
      .catch((err) => console.error('[useMessages] removeConversationTag', err))
  }

  const closeDay = () => {
    if (dayStatus !== 'open') return
    apiPost('/days/close')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages(), refreshArchivedDays()]))
      .catch((err) => console.error('[useMessages] closeDay', err))
  }

  const openNewDay = () => {
    if (dayStatus !== 'closed') return
    apiPost('/days/open')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages()]))
      .catch((err) => console.error('[useMessages] openNewDay', err))
  }

  const entrantes = messages.filter((m) => m.direction === 'in')
  const stats = {
    total: entrantes.length,
    automaticos: entrantes.filter((m) => m.type === 'automatico').length,
    pendientes: entrantes.filter((m) => m.status === 'pendiente').length,
  }

  return {
    messages,
    resolveConversation,
    sendMessage,
    addNote,
    assignments,
    assignConversation,
    changeConversationAgent,
    addConversationTag,
    removeConversationTag,
    conversationsMeta,
    drafts,
    stats,
    dayStatus,
    dayOpenedAt,
    dayClosedAt,
    archivedDays,
    closeDay,
    openNewDay,
  }
}
