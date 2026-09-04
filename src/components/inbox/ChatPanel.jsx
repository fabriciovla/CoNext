import { Fragment, useEffect, useRef, useState } from 'react'
import FormattedText, { stripFormat } from '../ui/FormattedText'
import MessageBubble from './MessageBubble'
import EmojiPicker from './EmojiPicker'
import { findAgent } from '../../utils/agents'
import { useIdioma } from '../../lib/i18n.jsx'
import {
  IconSend,
  IconInbox,
  IconSmile,
  IconNote,
  IconPaperclip,
  IconMic,
  IconStop,
  IconTrash,
  IconFile,
  IconClose,
} from '../ui/icons'

function formatDayLabel(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// Cuánto silencio corta un bloque de mensajes. Dos "hola" seguidos son una
// andanada y van pegados; los mismos dos "hola" con ocho horas en el medio son
// dos veces que el cliente escribió, y agruparlos sería mentir sobre el ritmo
// de la conversación.
const HUECO_BLOQUE_MS = 5 * 60 * 1000

// Dos mensajes son del mismo bloque si los dijo el mismo (mismo lado y, del
// lado de acá, el mismo autor), sin cambio de día y sin un silencio largo en el
// medio. Los eventos del sistema nunca agrupan: cortan el hilo por definición.
function mismoBloque(a, b) {
  if (!a || !b) return false
  if (a.direction === 'evento' || b.direction === 'evento') return false
  if (a.direction !== b.direction) return false
  if (a.direction === 'out' && a.author !== b.author) return false
  if (!sameDay(a.createdAt, b.createdAt)) return false
  return new Date(b.createdAt) - new Date(a.createdAt) < HUECO_BLOQUE_MS
}

// Cuánto separa la entrada de un mensaje nuevo de la del siguiente del mismo
// lote. El caso que importa son dos: el cliente escribe y la IA le contesta, y
// las dos filas llegan en el mismo poll — sin escalonarlas aparecen juntas y no
// se lee que una es la respuesta de la otra.
const ESCALON_ENTRADA_MS = 300

// Y el tope, para cuando llegan muchos de golpe: el poll se pausa con la
// ventana escondida, así que volver a la app después de un rato trae la tanda
// entera. Sin tope, el último mensaje esperaría varios segundos para aparecer.
const MAX_ESCALONES = 3

// Cuanto se queda como minimo el aviso de "Enviando…". Ver handleSend.
const MIN_AVISO_ENVIO_MS = 700

// WhatsApp corta el cuerpo del mensaje en 4096 caracteres: mejor frenarlo acá
// que descubrirlo cuando la API lo rechaza.
const MAX_CARACTERES = 4096

// Tope de la nota de voz. Cinco minutos en opus son ~1 MB, muy lejos de los
// 16 MB de Meta: el corte es para que un botón que quedó apretado sin querer no
// grabe media hora.
const MAX_SEGUNDOS_AUDIO = 5 * 60

// Formatos de grabación en orden de preferencia. El primero que soporte el
// navegador es el que se usa: ogg/opus es el de las notas de voz de WhatsApp y
// sale derecho, y webm/opus (lo único que graba Chrome) lo convierte el server.
const FORMATOS_GRABACION = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']

const EXT_AUDIO = { 'audio/ogg': 'ogg', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3' }

function kindDeMime(mime) {
  const base = String(mime ?? '').split(';')[0]
  if (base.startsWith('image/')) return 'image'
  if (base.startsWith('audio/')) return 'audio'
  if (base.startsWith('video/')) return 'video'
  return 'document'
}

function pesoLegible(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function reloj(segundos) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

// 36px y no 28: son los controles que más se tocan de la pantalla y estaban
// por debajo del mínimo cómodo para apuntarles. Adentro de una isla con
// esquinas de 24px y texto de 14.5px, además, se veían de otra escala.
function ComposerButton({ title, onClick, active = false, children }) {
  // El `title` ya llega traducido de quien lo usa: este componente es una forma,
  // no un texto.
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-tint/[0.07] ${
        active ? 'text-violet' : 'text-ink-muted hover:text-ink-primary'
      }`}
    >
      {children}
    </button>
  )
}

// El panel es el hilo y el cuadro de respuesta, nada más. Con quién estás
// hablando, qué se hace con la conversación (asignar, resolver) y el buscador
// del hilo viven en la ficha de contacto de la derecha, que ahora está siempre
// a la vista: repetirlo acá arriba era decir dos veces lo mismo.
export default function ChatPanel({
  group,
  onSend,
  onSendMedia,
  onAddNote,
  agents = [],
  disabled = false,
  // El texto por defecto lo pone Inbox, que es quien sabe por qué está cerrado.
  disabledMessage = '',
  aiDraft,
  // Lo que se esté buscando dentro del hilo. El input vive en la ficha de
  // contacto, así que el estado es de Inbox y baja por acá para filtrar.
  search = '',
}) {
  const { t, locale } = useIdioma()
  const [draft, setDraft] = useState('')
  // 'mensaje' se le envía al cliente; 'nota' queda para el equipo. Es el mismo
  // cuadro de texto porque se alterna todo el tiempo mientras se responde.
  const [mode, setMode] = useState('mensaje')
  const [emojiOpen, setEmojiOpen] = useState(false)
  // El texto escrito ocupa más de un renglón. Lo mide el efecto que estira el
  // cuadro, que ya sabe cuánto creció.
  const [multilinea, setMultilinea] = useState(false)
  // La sugerencia se pliega por conversación: plegarla no la borra en el server,
  // la deja en una línea de la que se puede volver a abrir.
  const [sugerenciaAbierta, setSugerenciaAbierta] = useState(true)
  // Archivo elegido y todavía sin mandar. `url` es un objectURL para la vista
  // previa: se revoca al soltarlo, si no el blob queda vivo hasta recargar.
  const [adjunto, setAdjunto] = useState(null)
  const [enviando, setEnviando] = useState(false)
  // Cuántos mensajes de texto están en el aire. Ver handleSend.
  const [enviosEnVuelo, setEnviosEnVuelo] = useState(0)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  // Fallos que son del navegador y no de la API (micrófono denegado, formato
  // que no se puede grabar): el banner de error de la API no los ve.
  const [errorMedia, setErrorMedia] = useState(null)
  const threadRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const grabacionRef = useRef(null)
  // Lo escrito y sin enviar en cada conversación, para poder ir y volver de la
  // lista sin perderlo. Vive en un ref: no hace falta re-renderizar por esto.
  const borradores = useRef({})
  const borradorVivo = useRef({ text: '', mode: 'mensaje' })
  const phoneAnterior = useRef(null)
  // Los ids que ya estaban la vuelta anterior, para saber cuáles son nuevos.
  // Va acá arriba con el resto y no al lado de donde se usa: abajo del `return`
  // de "elegí una conversación" sería un hook que existe o no según la
  // prop, y React desmonta el árbol entero al elegir un contacto.
  const entradas = useRef({ phone: null, firma: '', nuevos: new Map(), conocidos: new Set() })

  const phone = group?.phone
  const messageCount = group?.messages.length

  // Reemplaza el adjunto pendiente soltando el objectURL del anterior.
  const ponerAdjunto = (file) => {
    setAdjunto((previo) => {
      if (previo?.url) URL.revokeObjectURL(previo.url)
      return { file, url: URL.createObjectURL(file), kind: kindDeMime(file.type) }
    })
    // Un archivo es para el cliente, no para el equipo: si el cuadro estaba en
    // nota interna, vuelve solo a mensaje.
    setMode('mensaje')
    setErrorMedia(null)
  }

  const quitarAdjunto = () => {
    setAdjunto((previo) => {
      if (previo?.url) URL.revokeObjectURL(previo.url)
      return null
    })
  }

  // Corta la grabación. `descartar` es lo que separa el botón de tirar del de
  // parar: el `stop` es el mismo, lo que cambia es si el blob termina colgado
  // del cuadro o en la basura. Va acá arriba, antes de los efectos, porque el
  // que cambia de conversación la llama.
  const detenerGrabacion = ({ descartar = false } = {}) => {
    const actual = grabacionRef.current
    if (!actual) return
    actual.descartar = descartar
    if (actual.recorder.state !== 'inactive') actual.recorder.stop()
    else actual.stream.getTracks().forEach((t) => t.stop())
    setGrabando(false)
  }

  // Al abrir otra conversación (o al llegar un mensaje) el hilo se posiciona
  // abajo, que es donde está lo último — igual que cualquier chat.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [phone, messageCount])

  // Espejo de lo que hay en el cuadro ahora mismo. El efecto de abajo corre
  // después de que `phone` cambió, cuando `draft` todavía es el de la
  // conversación que estamos dejando: este ref es el que tiene ese valor.
  useEffect(() => {
    borradorVivo.current = { text: draft, mode }
  }, [draft, mode])

  // Al cambiar de conversación se guarda lo que quedó a medio escribir y se
  // recupera lo que había en la nueva. Los paneles sí arrancan cerrados: son
  // estado de la vista, no del mensaje.
  useEffect(() => {
    const anterior = phoneAnterior.current
    if (anterior && anterior !== phone) {
      const { text, mode: modoPrevio } = borradorVivo.current
      if (text.trim()) borradores.current[anterior] = { text, mode: modoPrevio }
      else delete borradores.current[anterior]
    }
    phoneAnterior.current = phone

    const guardado = phone ? borradores.current[phone] : null
    setDraft(guardado?.text ?? '')
    setMode(guardado?.mode ?? 'mensaje')
    setEmojiOpen(false)
    setSugerenciaAbierta(true)
    setErrorMedia(null)
    // El adjunto no se guarda como el texto: es de la conversación en la que se
    // eligió, y aparecer con la foto de otro chat colgada del cuadro es
    // exactamente cómo se manda algo al contacto equivocado.
    setAdjunto((previo) => {
      if (previo?.url) URL.revokeObjectURL(previo.url)
      return null
    })
    detenerGrabacion({ descartar: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone])

  // Cronómetro de la nota de voz, con corte automático en el tope.
  useEffect(() => {
    if (!grabando) return
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s + 1 >= MAX_SEGUNDOS_AUDIO) detenerGrabacion()
        return s + 1
      })
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grabando])

  // Salir de la bandeja con el micrófono abierto tiene que soltarlo: si no, el
  // navegador se queda mostrando que la pestaña está grabando.
  useEffect(() => {
    return () => {
      grabacionRef.current?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // El cuadro crece con lo que se escribe en vez de dejar el texto largo
  // metido en dos renglones con scroll. A partir del tope, scrollea.
  //
  // De paso avisa cuándo el texto pasó de un renglón: con dos o tres líneas,
  // el texto encajonado entre los botones queda angosto y con los íconos
  // colgando en las esquinas de un bloque alto. Pasado ese punto el texto se
  // queda con el ancho entero y los controles bajan a su propia fila.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`

    // El alto de un renglón sale del propio elemento y no de un número escrito
    // a mano: si cambia la tipografía o el padding, esto lo sigue.
    const estilo = getComputedStyle(el)
    const unRenglon =
      parseFloat(estilo.lineHeight) + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)
    setMultilinea(el.scrollHeight > unRenglon + 4)
  }, [draft])

  // Abrir una conversación deja el cursor listo para responder, que es a lo
  // que se viene. En pantallas chicas no, porque levantaría el teclado.
  useEffect(() => {
    if (!phone || disabled) return
    if (window.matchMedia?.('(hover: none)').matches) return
    textareaRef.current?.focus()
  }, [phone, disabled])

  if (!group) {
    // El bloque entra entero y de una. El ícono rebotaba con `animate-pop-in` y
    // el texto lo seguía 60 ms después: dos movimientos coreografiados para
    // decir "no hay nada seleccionado".
    return (
      <div className="animate-fade-in flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-surface-card text-center">
        <IconInbox size={28} className="text-ink-faint" />
        <p className="text-[13px] leading-relaxed text-ink-faint">
          {t('bandeja.elegiConversacion')}
          <br />
          {t('bandeja.elegiConversacionPie')}
        </p>
      </div>
    )
  }

  const agent = findAgent(agents, group.agent)

  const excedido = draft.length > MAX_CARACTERES
  const puedeEnviar = Boolean(draft.trim() || adjunto) && !excedido && !disabled && !enviando
  const haySugerencia = Boolean(aiDraft) && !disabled

  // Devuelve el foco al cuadro dejando el cursor donde corresponde: después de
  // elegir un emoji o una plantilla uno sigue escribiendo, no vuelve al mouse.
  const enfocarEn = (posicion) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      const pos = posicion ?? el.value.length
      el.setSelectionRange(pos, pos)
    })
  }

  const insertarEnCursor = (texto) => {
    const el = textareaRef.current
    const inicio = el?.selectionStart ?? draft.length
    const fin = el?.selectionEnd ?? draft.length
    setDraft(draft.slice(0, inicio) + texto + draft.slice(fin))
    enfocarEn(inicio + texto.length)
  }

  const elegirArchivo = (e) => {
    const file = e.target.files?.[0]
    // El input se limpia siempre: sin esto, elegir el mismo archivo dos veces
    // seguidas no dispara el change la segunda vez.
    e.target.value = ''
    if (file) ponerAdjunto(file)
  }

  const empezarGrabacion = async () => {
    setErrorMedia(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMedia(t('bandeja.sinMicrofono'))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const formato = FORMATOS_GRABACION.find((f) => MediaRecorder.isTypeSupported(f))
      const recorder = new MediaRecorder(stream, formato ? { mimeType: formato } : undefined)
      const partes = []

      recorder.ondataavailable = (e) => {
        if (e.data.size) partes.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const { descartar } = grabacionRef.current ?? {}
        grabacionRef.current = null
        if (descartar || partes.length === 0) return

        const mime = recorder.mimeType || 'audio/webm'
        const blob = new Blob(partes, { type: mime })
        const ext = EXT_AUDIO[mime.split(';')[0]] ?? 'webm'
        // Queda como adjunto pendiente en vez de salir disparada: una nota de
        // voz se escucha antes de mandarla, y sin ese paso el único arreglo de
        // un audio mal grabado es mandar otro pidiendo disculpas.
        ponerAdjunto(
          new File([blob], `${t('bandeja.nombreNotaDeVoz')}-${Date.now()}.${ext}`, { type: mime }),
        )
      }

      grabacionRef.current = { recorder, stream, descartar: false }
      recorder.start()
      setSegundos(0)
      setGrabando(true)
    } catch {
      setErrorMedia(t('bandeja.microfonoDenegado'))
    }
  }

  const handleSend = async () => {
    const body = draft.trim()
    if (disabled || excedido || enviando) return

    if (adjunto) {
      if (!onSendMedia) return
      setEnviando(true)
      try {
        // La nota de voz no acepta epígrafe del lado de Meta, así que lo escrito
        // sale como un mensaje aparte y no se pierde. En los demás adjuntos va
        // de epígrafe, que es como se ve del otro lado.
        const esAudio = adjunto.kind === 'audio'
        await onSendMedia(group.phone, adjunto.file, esAudio ? '' : body)
        if (esAudio && body) onSend(group.phone, body)
        quitarAdjunto()
        setDraft('')
        setEmojiOpen(false)
        delete borradores.current[group.phone]
        enfocarEn(0)
      } catch {
        // El detalle ya lo muestra el banner de error de la API; acá solo hay
        // que dejar el archivo donde está para poder reintentar.
      } finally {
        setEnviando(false)
      }
      return
    }

    if (!body) return
    if (mode === 'nota') onAddNote(group.phone, body)
    else {
      // Un contador y no un booleano: el texto se manda sin bloquear el cuadro,
      // así que puede haber varios en el aire y el aviso tiene que quedarse
      // hasta que vuelva el último. `enviando`, el de los adjuntos, sí bloquea
      // —una subida no es instantánea y reintentarla a ciegas duplica archivos—
      // y por eso es otro estado.
      setEnviosEnVuelo((n) => n + 1)
      const inicio = Date.now()
      Promise.resolve(onSend(group.phone, body)).finally(() => {
        // El envío suele tardar menos que la propia animación de entrada del
        // aviso, así que sin este piso aparecería y se iría en el mismo gesto:
        // un parpadeo, que se lee como que algo falló. Que se quede un instante
        // de más no cuesta nada — el mensaje ya está en el hilo.
        const restante = Math.max(0, MIN_AVISO_ENVIO_MS - (Date.now() - inicio))
        setTimeout(() => setEnviosEnVuelo((n) => Math.max(0, n - 1)), restante)
      })
    }
    setDraft('')
    setEmojiOpen(false)
    delete borradores.current[group.phone]
    enfocarEn(0)
  }

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + \ alterna entre responderle al cliente y dejar una nota
    // interna, sin sacar las manos del teclado ni perder lo escrito.
    if (e.key === '\\' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (!adjunto) setMode((m) => (m === 'nota' ? 'mensaje' : 'nota'))
      return
    }
    if (e.key === 'Escape' && emojiOpen) {
      // Escape cierra el panel y nada más: lo escrito se conserva.
      e.preventDefault()
      setEmojiOpen(false)
      return
    }

    // Enter envía, Shift+Enter hace salto de línea.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // La sugerencia baja al cuadro en modo mensaje: es una respuesta para el
  // cliente, no una nota, y si el cuadro estaba en nota se enviaría al equipo.
  const usarSugerenciaIA = () => {
    if (!aiDraft) return
    setMode('mensaje')
    setDraft(aiDraft.text)
    setSugerenciaAbierta(false)
    enfocarEn(aiDraft.text.length)
  }

  // Empezar a escribir pliega la sugerencia: si uno ya está redactando, la
  // propuesta pasa a ser una referencia, no lo primero que se lee.
  const handleChange = (e) => {
    setDraft(e.target.value)
    if (e.target.value.trim()) setSugerenciaAbierta(false)
  }

  // Qué mensajes llegaron con el hilo ya abierto. La cuenta se lleva sobre
  // `group.messages` y no sobre los filtrados, porque escribir en el buscador
  // cambia la lista visible y los que vuelven a entrar no son nuevos: ya
  // estaban.
  //
  // Se calcula durante el render y no en un efecto: en un efecto el mensaje se
  // pinta primero sin la clase y recién después la recibe, con lo que se ve
  // aparecer entero y enseguida rehacer la entrada. Para que sea idempotente
  // —React puede llamar al render dos veces por el mismo estado— el trabajo se
  // saltea si la lista de ids es la misma de la vuelta anterior.
  const firma = group.messages.map((m) => m.id).join('|')

  if (entradas.current.firma !== firma) {
    const otraConversacion = entradas.current.phone !== group.phone
    const nuevos = new Map()

    // Al abrir una conversación no entra nada: la charla ya pasó, está ahí.
    if (!otraConversacion) {
      let i = 0
      for (const { id } of group.messages) {
        if (entradas.current.conocidos.has(id)) continue
        nuevos.set(id, Math.min(i, MAX_ESCALONES) * ESCALON_ENTRADA_MS)
        i += 1
      }
    }

    entradas.current = {
      phone: group.phone,
      firma,
      nuevos,
      conocidos: new Set(group.messages.map((m) => m.id)),
    }
  }

  const nuevos = entradas.current.nuevos

  const query = search.trim().toLowerCase()
  const visibleMessages = query
    ? group.messages.filter((m) => m.text.toLowerCase().includes(query))
    : group.messages

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-surface-card">
      {/* El hilo usa el ancho del panel y solo se centra en pantallas muy
          grandes, donde estirarlo de borde a borde dejaría la conversación
          desparramada. Por debajo de ese tope el padding es el normal.
          El tope es 56rem y no el ancho entero: una conversación se lee como
          una columna, no como una tabla. */}
      {/* Abrir una conversación no anima nada, y es a propósito: los globos
          entraban uno atrás del otro, escalonados, cada vez que se abría un
          contacto. Ningún chat hace eso — la charla ya pasó, está ahí — y era
          lo que hacía que la bandeja se sintiera una demo.
          Lo que sí entra animado es lo que *llega* con el hilo abierto, que es
          el caso contrario: ahí el movimiento no adorna, avisa. Y va escalonado
          porque el mensaje del cliente y la respuesta de la IA llegan en el
          mismo poll: apareciendo juntos no se lee que una contesta a la otra. */}
      <ul
        ref={threadRef}
        data-tour="inbox-hilo"
        className="min-h-0 flex-1 overflow-y-auto px-[max(1.25rem,calc((100%-56rem)/2))] py-5"
      >
        {visibleMessages.map((message, i) => {
          const prev = visibleMessages[i - 1]
          const next = visibleMessages[i + 1]
          const showDay = !prev || !sameDay(prev.createdAt, message.createdAt)

          return (
            <Fragment key={message.id}>
              {showDay && (
                <li className="mt-5 flex justify-center first:mt-0">
                  <span className="px-2.5 py-1 text-[11.5px] text-ink-faint first-letter:uppercase">
                    {formatDayLabel(message.createdAt, locale)}
                  </span>
                </li>
              )}
              {/* Qué agente contestó lo dice el mensaje, no la conversación:
                  el modelo elige uno en cada respuesta, así que un mismo hilo
                  puede tener contestando a Ventas y a Soporte. Antes salía
                  siempre el de la ficha de la derecha, con lo cual el rótulo
                  decía lo mismo en todos los globos y no informaba nada. El de
                  la conversación queda de respaldo para los mensajes viejos,
                  anteriores a que se guardara el agente en la fila. */}
              <MessageBubble
                message={message}
                agentName={findAgent(agents, message.agentKey ?? group.agent).name}
                primero={!mismoBloque(prev, message)}
                ultimo={!mismoBloque(message, next)}
                entra={nuevos.has(message.id)}
                retraso={nuevos.get(message.id) ?? 0}
              />
            </Fragment>
          )
        })}

        {visibleMessages.length === 0 && (
          <li className="py-10 text-center text-[12.5px] text-ink-faint">
            {t('bandeja.sinCoincidencias', { query: search.trim() })}
          </li>
        )}
      </ul>

      {/* Más angosto que el hilo (48rem contra 56rem) y centrado: el cuadro se
          lee como una isla apoyada abajo y no como otro renglón de la
          conversación. Va con el mismo tope todo lo que es del cuadro — la
          sugerencia de la IA y los avisos —, así que el bloque de abajo se
          alinea entero.
          Sin línea divisoria arriba: lo que separa al composer del hilo es el
          aire y su propia forma, no una raya cruzando el panel. Esa raya, más
          el borde del cuadro, eran dos separaciones para lo mismo. */}
      <div data-tour="inbox-composer" className="mx-auto w-full max-w-[48rem] shrink-0 px-5 pb-4 pt-2">
        {/* La sugerencia de la IA es una tarjeta propia apoyada arriba del
            cuadro, no algo metido adentro: el cuadro es lo que uno escribe y
            esto es lo que propone el bot. Adentro competía con el texto
            propio y empujaba el composer cada vez que llegaba una. */}
        {haySugerencia &&
          (sugerenciaAbierta ? (
            <div className="mb-2 rounded-2xl border border-tint/[0.09] bg-tint/[0.02] px-3.5 py-2.5">
              <p className="text-[11px] text-ink-faint">
                {t('bandeja.sugerenciaDe', { nombre: agent.name })}
              </p>
              <div className="mt-1 whitespace-pre-wrap text-[13.5px] leading-snug text-ink-secondary">
                <FormattedText>{aiDraft.text}</FormattedText>
              </div>
              {/* Las acciones abajo y a la derecha, donde termina de leerse el
                  texto y del lado del botón de enviar. Sin franja separada ni
                  botón sólido: el único que va lleno en esta esquina de la
                  pantalla es el de enviar, y este le competía de igual a igual
                  para una cosa que ni siquiera sale. */}
              <div className="mt-1.5 flex items-center justify-end gap-0.5">
                <button
                  onClick={() => setSugerenciaAbierta(false)}
                  className="rounded-lg px-2 py-0.5 text-[11.5px] text-ink-faint transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
                >
                  {t('bandeja.descartar')}
                </button>
                <button
                  onClick={usarSugerenciaIA}
                  className="rounded-lg px-2 py-0.5 text-[11.5px] font-medium text-violet transition-colors duration-200 hover:bg-violet-soft"
                >
                  {t('bandeja.usarYEditar')}
                </button>
              </div>
            </div>
          ) : (
            // Plegada queda una sola línea: la sugerencia no se pierde por
            // haber empezado a escribir, pero tampoco le compite al mensaje.
            <button
              onClick={() => setSugerenciaAbierta(true)}
              className="mb-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-1 text-left text-[11.5px] transition-colors duration-200 hover:bg-tint/[0.05]"
            >
              <span className="shrink-0 text-ink-faint">{t('bandeja.sugerencia')}</span>
              <span className="min-w-0 flex-1 truncate text-ink-muted">
                {stripFormat(aiDraft.text)}
              </span>
              <span className="shrink-0 font-medium text-violet">{t('bandeja.ver')}</span>
            </button>
          ))}

        {/* Fallos del navegador, no de la API: el micrófono denegado o un
            formato que no se puede grabar no pasan por el banner de error. */}
        {errorMedia && (
          <p className="mb-2 rounded-xl border border-status-critical/30 bg-status-critical/[0.07] px-3 py-1.5 text-[12px] text-status-critical">
            {errorMedia}
          </p>
        )}

        {/* En modo nota el aviso va arriba de la isla y en una línea. Adentro
            del cuadro estaba el rótulo del canal, que decía lo mismo en todos
            los mensajes: que se contesta por WhatsApp ya lo dice la bandeja. */}
        {mode === 'nota' && !disabled && (
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11.5px]">
            <IconNote size={13} className="shrink-0 text-status-warning" />
            <span className="text-status-warning">{t('bandeja.notaInterna')}</span>
            <span className="text-ink-faint">{t('bandeja.notaInternaAviso')}</span>
          </p>
        )}

        {disabled ? (
          <p className="rounded-2xl border border-tint/[0.07] py-3.5 text-center text-[12px] text-ink-faint">
            {disabledMessage}
          </p>
        ) : (
          <div
            onClick={(e) => {
              // Click en cualquier lado del bloque (menos en un control) manda
              // el cursor al texto: el área clickeable es toda la caja.
              if (e.target === e.currentTarget) textareaRef.current?.focus()
            }}
            // Isla: superficie elevada y bien redondeada, apoyada sobre el hilo
            // en vez de encajada contra él. En el tema oscuro la levanta el
            // fondo (`raised` es más claro que `card`); en el claro los dos son
            // blancos, así que ahí el trabajo lo hacen el borde y la sombra.
            className={`relative rounded-3xl border shadow-card transition-colors duration-300 ${
              mode === 'nota'
                ? // La isla entera se tiñe de ámbar escribiendo una nota. Es lo
                  // que evita mandarle al cliente algo que era para el equipo:
                  // el color se ve antes de apretar Enter.
                  'border-status-warning/30 bg-status-warning/[0.06] focus-within:border-status-warning/60'
                : excedido
                  ? 'border-status-critical/50 bg-surface-raised'
                  : 'border-tint/[0.09] bg-surface-raised focus-within:border-tint/25'
            }`}
          >
            {/* El adjunto que se está por mandar va arriba del renglón de
                escritura, no en una ventana aparte: lo que se tipee abajo es su
                epígrafe y se manda junto, en el mismo mensaje. */}
            {adjunto && (
              <div className="m-1.5 mb-0 flex items-center gap-2.5 rounded-xl border border-tint/10 bg-tint/[0.04] p-1.5">
                {adjunto.kind === 'image' ? (
                  <img src={adjunto.url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : adjunto.kind === 'audio' ? (
                  // La nota de voz se escucha antes de mandarla: el reproductor
                  // ocupa el lugar del nombre, que para un audio no dice nada.
                  <audio src={adjunto.url} controls className="h-9 min-w-0 flex-1" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tint/[0.06] text-ink-muted">
                    <IconFile size={18} />
                  </span>
                )}

                {adjunto.kind !== 'audio' && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink-primary">{adjunto.file.name}</span>
                    <span className="block text-[11px] text-ink-faint">{pesoLegible(adjunto.file.size)}</span>
                  </span>
                )}

                <ComposerButton title={t('bandeja.quitarAdjunto')} onClick={quitarAdjunto}>
                  <IconClose size={16} />
                </ComposerButton>
              </div>
            )}

            {grabando ? (
              // Grabando, el renglón entero es la grabación: no hay nada que
              // hacer con el cuadro hasta soltar el micrófono, y dejar los
              // controles de escribir a la vista solo invita a errarle.
              <div className="flex items-center gap-2 p-1.5">
                <ComposerButton
                  title={t('bandeja.descartarGrabacion')}
                  onClick={() => detenerGrabacion({ descartar: true })}
                >
                  <IconTrash size={18} />
                </ComposerButton>
                <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-ink-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-status-critical" />
                  {t('bandeja.grabando')}
                  <span className="tabular-nums text-ink-muted">{reloj(segundos)}</span>
                </span>
                <button
                  onClick={() => detenerGrabacion()}
                  title={t('bandeja.terminarGrabacion')}
                  aria-label={t('bandeja.terminarGrabacion')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-primary text-ink-inverted transition-colors duration-200 hover:bg-ink-primary/85"
                >
                  <IconStop size={14} />
                </button>
              </div>
            ) : (
              // Con una línea escrita: el texto arranca en el borde izquierdo y
              // todos los controles van juntos a la derecha. Con varias, el
              // texto se lleva la fila entera y los controles bajan abajo — lo
              // hace `flex-wrap` más el `order`, sin duplicar el bloque de
              // botones para las dos formas.
              <div className="flex flex-wrap items-end gap-0.5 gap-y-1 p-1.5">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={draft}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  aria-label={
                    mode === 'nota' ? t('bandeja.notaInterna') : t('bandeja.mensajeParaCliente')
                  }
                  // Voseo, como el resto de la dashboard ("Elegí", "Contame",
                  // "Buscás"). El "Escribe" neutro era el único imperativo en
                  // español de traducción de toda la pantalla.
                  placeholder={
                    mode === 'nota' ? t('bandeja.escribiNota') : t('bandeja.escribiMensaje')
                  }
                  className={`max-h-40 min-h-[2.25rem] min-w-0 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-[14.5px] leading-snug text-ink-primary placeholder:text-ink-faint focus:outline-none
                    ${multilinea ? 'order-0 basis-full' : 'order-2 flex-1'}`}
                />

                {/* Todos los controles van juntos en un contenedor propio, a la
                    derecha del texto: es lo que los mantiene pegados al borde
                    (`ml-auto`) cuando el texto se subió a su propia fila y esta
                    queda medio vacía. `relative` es el ancla del panel de
                    emojis. */}
                <div className="relative order-3 ml-auto flex shrink-0 items-center gap-0.5">
                  <ComposerButton
                    title={t('bandeja.emoji')}
                    active={emojiOpen}
                    onClick={() => setEmojiOpen((v) => !v)}
                  >
                    <IconSmile size={18} />
                  </ComposerButton>
                  {emojiOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setEmojiOpen(false)} />
                      {/* El emoji entra donde está el cursor, no al final: se
                          usa tanto para abrir un saludo como para cerrar. */}
                      <EmojiPicker onPick={insertarEnCursor} onClose={() => setEmojiOpen(false)} />
                    </>
                  )}

                  <ComposerButton
                    title={t('bandeja.adjuntar')}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconPaperclip size={18} />
                  </ComposerButton>

                  {/* Con un archivo colgado no se puede pasar a nota: una nota
                      interna no lleva adjunto, y el botón de enviar mandaría el
                      archivo al cliente igual. */}
                  {!adjunto && (
                    <ComposerButton
                      title={t('bandeja.cambiarANota')}
                      active={mode === 'nota'}
                      onClick={() => setMode((m) => (m === 'nota' ? 'mensaje' : 'nota'))}
                    >
                      <IconNote size={18} />
                    </ComposerButton>
                  )}

                  {/* El contador aparece recién cerca del límite: mostrarlo
                      siempre sería ruido, un mensaje de atención rara vez pasa de
                      un par de renglones. */}
                  {draft.length > MAX_CARACTERES - 400 && (
                    <span
                      className={`px-1 text-[11px] tabular-nums ${excedido ? 'text-status-critical' : 'text-ink-muted'}`}
                    >
                      {draft.length} / {MAX_CARACTERES}
                    </span>
                  )}

                  {/* Subir puede tardar, y sin esto el único cambio visible es
                      que el botón de enviar se apaga. */}
                  {enviando && (
                    <span className="px-1 text-[11px] text-ink-muted">{t('bandeja.enviando')}</span>
                  )}

                  {/* El micrófono no está en modo nota (una nota interna es texto)
                      ni con algo ya adjuntado: cada mensaje lleva un archivo. */}
                  {mode !== 'nota' && !adjunto && !enviando && (
                    <ComposerButton title={t('bandeja.grabarNota')} onClick={empezarGrabacion}>
                      <IconMic size={18} />
                    </ComposerButton>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={!puedeEnviar}
                    title={
                      excedido
                        ? t('bandeja.excedido', { max: MAX_CARACTERES })
                        : mode === 'nota'
                          ? t('bandeja.guardarNotaEnter')
                          : t('bandeja.enviarMensajeEnter')
                    }
                    aria-label={
                      mode === 'nota' ? t('bandeja.guardarNota') : t('bandeja.enviarMensaje')
                    }
                    // Redondo, como la isla que lo contiene.
                    //
                    // Mismo relleno que `<Button variant="primary">`: es el
                    // botón de acción de la app y tiene que ser el mismo.
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200
                      disabled:cursor-not-allowed disabled:opacity-35 ${
                        mode === 'nota'
                          ? 'bg-status-warning text-status-ink hover:bg-status-warning/85'
                          : 'bg-violet text-ink-inverted hover:bg-violet/90'
                      }`}
                  >
                    <IconSend size={18} />
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={elegirArchivo}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}

        {/* Envío en curso. Va **debajo** de la isla y no arriba, que es donde
            van los otros avisos: los de arriba son cosas que hay que saber
            antes de escribir (que esto es una nota interna, que falló el
            micrófono), y este es el eco de algo que ya se hizo. Leerlo es
            opcional y se va solo.

            El alto queda reservado siempre. Apareciendo y desapareciendo con
            `hidden`, la isla entera daría un salto de cuatro píxeles en cada
            mensaje — que es justo el momento en que la persona está mirando
            ahí. Es la misma razón por la que los controles que aparecen al
            pasar el mouse reservan su lugar. */}
        <div className="h-[22px] px-1 pt-1.5">
          {enviosEnVuelo > 0 && (
            // `animate-fade-down` arranca 12px más arriba y baja hasta su lugar:
            // sale de abajo de la isla, que es de donde vino el mensaje.
            <div className="flex animate-fade-down items-center gap-2">
              {/* El riel es fijo y lo que se mueve es el trozo violeta adentro,
                  recortado por el `overflow-hidden` del riel. */}
              <span className="relative block h-[3px] w-20 shrink-0 overflow-hidden rounded-full bg-tint/[0.09]">
                <span className="absolute inset-y-0 left-0 block w-1/3 animate-barrido rounded-full bg-violet" />
              </span>
              <span className="text-[11px] leading-none text-ink-faint">
                {enviosEnVuelo > 1
                  ? t('bandeja.enviandoVarios', { n: enviosEnVuelo })
                  : t('bandeja.enviando')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
