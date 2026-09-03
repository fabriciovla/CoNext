import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '../api/client'
import { dayStats } from '../utils/metrics'
import { sonidoEnviar, sonidoRecibir } from '../lib/sonidos'
import { avisarEnEscritorio, esEscritorio, marcarPendientesEnEscritorio } from '../lib/entorno'
import { dibujarInsignia } from '../lib/insignia'
import { vistaPrevia } from '../utils/groupMessages'
import { formatPhone } from '../utils/phone'

const POLL_MS = 6000

// Con la pantalla escondida se sigue poleando, pero cada 30s en vez de cada 6.
// Antes el poll se salteaba entero (`if (document.hidden) return`), que con la
// app de escritorio en la bandeja significaba no enterarse de nada hasta que
// alguien la abriera: ni aviso, ni sonido, ni contador. Los 30s son el punto
// entre eso y castigar al server con la app abierta de fondo todo el día.
//
// En la app esto anda porque la ventana se crea con `backgroundThrottling:
// false`; en una pestaña del navegador Chromium igual estira los temporizadores
// de una pestaña de fondo a más o menos un minuto, y está bien que así sea.
const POLL_OCULTO_MS = 30000

const quienEs = (mensaje) => mensaje.customer || formatPhone(mensaje.phone) || mensaje.phone

// El aviso del sistema por los mensajes que entraron en este poll.
//
// Es **uno solo** aunque hayan entrado cuatro: cuatro globos apilados en la
// esquina tapan la pantalla y no se lee ninguno. Y no sale con la ventana a la
// vista y enfocada: ahí ya está el sonido, y el mensaje apareciendo solo en el
// hilo es mejor aviso que un cartel del sistema arriba de la propia app.
function avisarDeNuevos(nuevos) {
  if (!esEscritorio() || nuevos.length === 0) return
  if (!document.hidden && document.hasFocus()) return

  const ultimo = nuevos[nuevos.length - 1]
  const conversaciones = new Set(nuevos.map((m) => m.phone))

  // De una sola conversación el aviso es el mensaje: quién escribió y qué dijo,
  // y el click abre ese hilo. De varias no hay un hilo al que llevar, así que
  // dice cuántos son y de cuántas personas, y el click abre la app y nada más.
  if (conversaciones.size === 1) {
    const cuantos = nuevos.length
    avisarEnEscritorio({
      titulo: quienEs(ultimo),
      cuerpo: cuantos > 1 ? `${vistaPrevia(ultimo)} · ${cuantos} mensajes` : vistaPrevia(ultimo),
      phone: ultimo.phone,
    })
    return
  }

  avisarEnEscritorio({
    titulo: `${nuevos.length} mensajes nuevos`,
    cuerpo: `De ${conversaciones.size} conversaciones. La última, ${quienEs(ultimo)}.`,
    phone: null,
  })
}

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
  // La primera vuelta de todas las consultas. Hasta que termina, la lista vacía
  // y el día "cerrado" son el valor inicial y no el estado real del cliente:
  // dibujarlos es contar algo que todavía no se sabe.
  const [cargando, setCargando] = useState(true)

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

  // Qué mensajes entrantes ya vimos, para tocar el aviso solo con los que
  // llegan de verdad en un poll y no con los que ya estaban la primera vez
  // que se cargó la bandeja. Arranca en null: hasta que no haya una vuelta
  // conocida contra qué comparar, nada es "nuevo" todavía.
  const entrantesConocidos = useRef(null)

  // Cuándo salió la última vuelta del poll, para espaciarlo con la ventana
  // escondida sin cambiar el intervalo (ver POLL_OCULTO_MS).
  const ultimoPoll = useRef(0)

  const refreshOpenMessages = useCallback(async () => {
    const data = await apiGet('/messages?day=open')
    const conocidos = entrantesConocidos.current
    const entrantes = data.filter((m) => m.direction === 'in')
    const nuevos = conocidos ? entrantes.filter((m) => !conocidos.has(m.id)) : []

    if (nuevos.length > 0) {
      sonidoRecibir()
      avisarDeNuevos(nuevos)
    }

    entrantesConocidos.current = new Set(entrantes.map((m) => m.id))
    setMessages(data)
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
    Promise.all([refreshDay(), refreshOpenMessages(), refreshArchivedDays(), refreshMeta(), refreshDrafts()])
      .catch(fallo('cargaInicial'))
      // Solo la primera vuelta prende esto: los polls que siguen no tienen que
      // volver a vaciar la pantalla, que ya tiene datos buenos dibujados.
      .finally(() => setCargando(false))

    const interval = setInterval(() => {
      // Escondida se polea igual, más espaciado. Se compara contra la última
      // vuelta *ejecutada* y no contra un contador de ticks: así, al volver a la
      // pantalla, la primera vuelta visible sale enseguida en vez de esperar a
      // que se cumpla el turno largo que había arrancado estando oculta.
      if (document.hidden && Date.now() - ultimoPoll.current < POLL_OCULTO_MS) return
      ultimoPoll.current = Date.now()

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
      refreshDay().catch(fallo('actualizarDia'))
      refreshOpenMessages().catch(fallo('actualizarMensajes'))
      refreshDrafts().catch(fallo('actualizarBorradores'))
      refreshMeta().catch(fallo('actualizarConversaciones'))
    }, POLL_MS)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El contador arriba del ícono en la barra de tareas: los entrantes sin
  // atender del día abierto, que es la suma de las burbujas naranjas de la
  // bandeja. Es lo que queda después de que la notificación se va sola, y lo
  // único que se ve con la app minimizada y sin mirar.
  //
  // Se compara contra la vuelta anterior porque este efecto corre con cada poll
  // (la lista es nueva aunque diga lo mismo) y redibujar el PNG y cruzar el IPC
  // cada seis segundos para poner el mismo número es trabajo al pedo.
  const pendientesMarcados = useRef(null)
  useEffect(() => {
    if (!esEscritorio()) return
    const pendientes = messages.filter((m) => m.direction === 'in' && m.status === 'pendiente').length
    if (pendientes === pendientesMarcados.current) return
    pendientesMarcados.current = pendientes
    marcarPendientesEnEscritorio(pendientes, dibujarInsignia(pendientes))
  }, [messages])

  const resolveConversation = (phone) => {
    if (dayStatus !== 'open') return
    apiPatch(`/conversations/${encodeURIComponent(phone)}/resolve`)
      .then(refreshOpenMessages)
      .catch(fallo('resolverConversacion'))
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
      .then(() => {
        sonidoEnviar()
        return Promise.all([refreshOpenMessages(), refreshDrafts()])
      })
      .catch((err) => {
        // Se saca el globo provisorio: dejarlo ahí afirmaría que el mensaje
        // salió, que es lo único que no puede pasar cuando falló el envío.
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        fallo('enviarMensaje')(err)
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
      .then((message) => {
        sonidoEnviar()
        return Promise.all([refreshOpenMessages(), refreshDrafts()]).then(() => message)
      })
      .catch((err) => {
        fallo('enviarAdjunto')(err)
        throw err
      })
  }

  const addNote = (phone, text) => {
    const body = text.trim()
    if (dayStatus !== 'open' || !body) return
    apiPost(`/conversations/${encodeURIComponent(phone)}/notes`, { text: body })
      .then(refreshOpenMessages)
      .catch(fallo('agregarNota'))
  }

  // `user` en null deja la conversación sin asignar, que es un estado válido
  // (la carpeta "Sin asignar" es justamente la que el equipo mira primero).
  const assignConversation = (phone, user) => {
    setAssignments((prev) => ({ ...prev, [phone]: user }))
    apiPatch(`/conversations/${encodeURIComponent(phone)}/assignee`, { assignee: user })
      .then(refreshMeta)
      .catch(fallo('asignarConversacion'))
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
      .catch(fallo('cambiarAgente'))
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
      .catch(fallo('agregarEtiqueta'))
  }

  const removeConversationTag = (phone, tag) => {
    setConversationsMeta((prev) => ({
      ...prev,
      [phone]: { ...prev[phone], tags: (prev[phone]?.tags ?? []).filter((t) => t !== tag) },
    }))
    apiDelete(`/conversations/${encodeURIComponent(phone)}/tags/${encodeURIComponent(tag)}`)
      .then(refreshMeta)
      .catch(fallo('quitarEtiqueta'))
  }

  const closeDay = () => {
    if (dayStatus !== 'open') return
    apiPost('/days/close')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages(), refreshArchivedDays()]))
      .catch(fallo('cerrarDia'))
  }

  const openNewDay = () => {
    if (dayStatus !== 'closed') return
    apiPost('/days/open')
      .then(() => Promise.all([refreshDay(), refreshOpenMessages()]))
      .catch(fallo('abrirDia'))
  }

  // Los mismos números salen para un día archivado (la variación de las
  // tarjetas de KPI lo compara contra este), así que el cálculo vive en
  // `utils/metrics` y no acá adentro.
  const stats = dayStats(messages)

  return {
    messages,
    cargando,
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
