import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '../api/client'
import { dayStats } from '../utils/metrics'

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
  // Último fallo contra la API. Antes todo esto terminaba en un console.error:
  // con el server caído o reiniciando, la bandeja se veía igual que una bandeja
  // vacía y los botones "no hacían nada" sin decir por qué. El estado se limpia
  // solo en cuanto un poll vuelve a responder.
  const [apiError, setApiError] = useState(null)

  // Handler de catch con el origen adentro, para no repetir el console.error en
  // cada mutación y que el mensaje que sube a la UI diga qué se estaba haciendo.
  const fallo = useCallback(
    (origen) => (err) => {
      console.error(`[useMessages] ${origen}`, err)
      setApiError({ origen, message: err.message })
    },
    [],
  )

  const refreshDay = useCallback(async () => {
    const day = await apiGet('/days/current')
    setDayStatus(day.status)
    setDayOpenedAt(day.openedAt)
    setDayClosedAt(day.closedAt)
  }, [])

  const refreshOpenMessages = useCallback(async () => {
    setMessages(await apiGet('/messages?day=open'))
    // El poll es lo que corre siempre: si este pasa, el server volvió.
    setApiError(null)
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
      fallo('carga inicial'),
    )

    const interval = setInterval(() => {
      if (document.hidden) return
      // El estado del día va en el poll y no solo en la carga inicial. Si esa
      // primera llamada falla (el server todavía no arrancó, o se reinició en el
      // medio), `dayStatus` se queda en 'closed', que es el valor inicial — y
      // como el poll de mensajes sí se recupera y encima limpia el aviso de
      // error, la dashboard se ve entera y sin ninguna señal de problema
      // mientras la barra insiste con "Día cerrado". Peor: `sendMessage`,
      // `addNote` y `resolveConversation` cortan por ese mismo `dayStatus`, así
      // que los botones dejan de hacer nada aunque el server tenga el día
      // abierto. `listClosedDays` no entra acá a propósito: trae todos los
      // mensajes de todo el historial y no cambia solo, únicamente al cerrar.
      refreshDay().catch(fallo('actualizar el estado del día'))
      refreshOpenMessages().catch(fallo('actualizar mensajes'))
      refreshDrafts().catch(fallo('actualizar borradores'))
      refreshMeta().catch(fallo('actualizar conversaciones'))
    }, POLL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolveConversation = (phone) => {
    if (dayStatus !== 'open') return
    apiPatch(`/conversations/${encodeURIComponent(phone)}/resolve`)
      .then(refreshOpenMessages)
      .catch(fallo('resolver la conversación'))
  }

  // El mensaje se dibuja antes de que conteste el server, y devuelve la promesa
  // para que el composer sepa cuándo terminó.
  //
  // Es una excepción a la regla de re-consultar en vez de parchear, y va en la
  // misma lista que las etiquetas y la asignación: acá el pipeline de IA no
  // puede cambiar nada: lo escribió una persona y el texto es el que es. Lo que
  // sí había era una espera de dos viajes —mandar y después volver a pedir
  // todos los mensajes del día— antes de que el globo apareciera. En un chat
  // eso se lee como que el botón no funcionó, y lleva a mandar de nuevo.
  //
  // El globo provisorio no se saca cuando llega la respuesta: lo reemplaza el
  // refresco, que trae la fila real con su id y su estado de entrega.
  const sendMessage = (phone, text) => {
    const body = text.trim()
    if (dayStatus !== 'open' || !body) return Promise.resolve()

    const tempId = `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        phone,
        customer: prev.find((m) => m.phone === phone)?.customer ?? phone,
        text: body,
        direction: 'out',
        type: null,
        status: 'resuelto',
        // Cualquier cosa que no sea 'bot': el globo del bot lleva el rayo del
        // agente y este lo escribió una persona.
        author: 'admin',
        agentKey: null,
        createdAt: new Date().toISOString(),
        // Estado propio del cliente, que el server nunca manda: es "todavía no
        // sabemos si salió". El pie del globo lo dibuja como un reloj en vez de
        // la tilde, para no decir "enviado" antes de que lo esté.
        deliveryStatus: 'enviando',
        deliveryError: null,
      },
    ])

    return apiPost('/messages', { phone, text: body })
      .then(() => Promise.all([refreshOpenMessages(), refreshDrafts()]))
      .catch((err) => {
        // Se saca el globo provisorio: dejarlo ahí afirmaría que el mensaje
        // salió, que es lo único que no puede pasar cuando falló el envío.
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        fallo('enviar el mensaje')(err)
      })
  }

  // Adjuntos (archivo, foto o nota de voz). Devuelve la promesa, a diferencia
  // del resto: el composer tiene que saber cuándo terminó para sacar el archivo
  // de la fila de envío y volver a habilitar el botón — una subida no es
  // instantánea como mandar texto.
  const sendMedia = (phone, file, caption = '') => {
    if (dayStatus !== 'open' || !file) return Promise.resolve(null)
    const form = new FormData()
    form.append('phone', phone)
    form.append('caption', caption)
    form.append('file', file, file.name)
    return apiUpload('/messages/media', form)
      .then((message) => Promise.all([refreshOpenMessages(), refreshDrafts()]).then(() => message))
      .catch((err) => {
        fallo('enviar el adjunto')(err)
        throw err
      })
  }

  const addNote = (phone, text) => {
    const body = text.trim()
    if (dayStatus !== 'open' || !body) return
    apiPost(`/conversations/${encodeURIComponent(phone)}/notes`, { text: body })
      .then(refreshOpenMessages)
      .catch(fallo('agregar la nota'))
  }

  // `user` en null deja la conversación sin asignar, que es un estado válido
  // (la carpeta "Sin asignar" es justamente la que el equipo mira primero).
  const assignConversation = (phone, user) => {
    setAssignments((prev) => ({ ...prev, [phone]: user }))
    apiPatch(`/conversations/${encodeURIComponent(phone)}/assignee`, { assignee: user })
      .then(refreshMeta)
      .catch(fallo('asignar la conversación'))
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
      .catch(fallo('cambiar el agente'))
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
      .catch(fallo('agregar la etiqueta'))
  }

  const removeConversationTag = (phone, tag) => {
    setConversationsMeta((prev) => ({
      ...prev,
      [phone]: { ...prev[phone], tags: (prev[phone]?.tags ?? []).filter((t) => t !== tag) },
    }))
    apiDelete(`/conversations/${encodeURIComponent(phone)}/tags/${encodeURIComponent(tag)}`)
      .then(refreshMeta)
      .catch(fallo('quitar la etiqueta'))
  }

  const closeDay = () => {
    if (dayStatus !== 'open') return
    apiPost('/days/close')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages(), refreshArchivedDays()]))
      .catch(fallo('cerrar el día'))
  }

  const openNewDay = () => {
    if (dayStatus !== 'closed') return
    apiPost('/days/open')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages()]))
      .catch(fallo('abrir el día'))
  }

  // Los mismos números salen para un día archivado (la variación de las
  // tarjetas de KPI lo compara contra este), así que el cálculo vive en
  // `utils/metrics` y no acá adentro.
  const stats = dayStats(messages)

  return {
    messages,
    resolveConversation,
    sendMessage,
    sendMedia,
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
    apiError,
    dismissApiError: () => setApiError(null),
  }
}
