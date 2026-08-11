import { Fragment, useEffect, useRef, useState } from 'react'
import Avatar from '../ui/Avatar'
import MessageBubble from './MessageBubble'
import { LIFECYCLES } from '../../data/mockData'
import { findAgent } from '../../utils/agents'
import {
  IconSend,
  IconInbox,
  IconSearch,
  IconClock,
  IconPhone,
  IconCheckCircle,
  IconDots,
  IconChevronDown,
  IconSparkles,
  IconSmile,
  IconPaperclip,
  IconTemplate,
  IconNote,
  IconMic,
  IconUser,
} from '../ui/icons'

function formatDayLabel(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// WhatsApp corta el cuerpo del mensaje en 4096 caracteres: mejor frenarlo acá
// que descubrirlo cuando la API lo rechaza.
const MAX_CARACTERES = 4096

// Los emojis que realmente se usan atendiendo: saludos, confirmaciones y
// plata. Un picker completo sería una dependencia entera para esto.
const EMOJIS = [
  '👋', '😊', '😀', '😅', '🙌', '👍', '🙏', '💪',
  '✅', '❌', '⏰', '📦', '🚚', '📍', '📎', '📄',
  '💳', '💰', '🧾', '🏷️', '🔥', '⭐', '🎉', '❤️',
  '😉', '😍', '🤔', '😕', '😥', '🙈', '👌', '✍️',
]

// Botón redondeado del header. Todos los de la fila derecha comparten forma y
// estados, así que se definen una sola vez.
function HeaderButton({ title, active = false, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.07] active:scale-95 ${
        active ? 'bg-white/[0.09] text-white' : 'text-white/45 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function ComposerButton({ title, onClick, active = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 hover:bg-white/[0.07] active:scale-95 ${
        active ? 'text-violet' : 'text-white/40 hover:text-white/85'
      }`}
    >
      {children}
    </button>
  )
}

export default function ChatPanel({
  group,
  onSend,
  onAddNote,
  onResolve,
  onAssign,
  agents = [],
  username = 'admin',
  disabled = false,
  disabledMessage = 'El día está cerrado. Abrí un nuevo día para responder.',
  aiDraft,
  quickReplies = [],
  onSaveQuickReply,
  onDeleteQuickReply,
}) {
  const [draft, setDraft] = useState('')
  // 'mensaje' se le envía al cliente; 'nota' queda para el equipo. Es el mismo
  // cuadro de texto porque se alterna todo el tiempo mientras se responde.
  const [mode, setMode] = useState('mensaje')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null) // 'asignar' | 'mas' | null
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  // Fila resaltada del panel de respuestas rápidas (se mueve con ↑/↓).
  const [quickIndex, setQuickIndex] = useState(0)
  // Con "/" escrito, Escape o un click afuera esconden el panel sin borrar el
  // texto; vuelve a aparecer apenas se sigue tipeando.
  const [slashSuprimido, setSlashSuprimido] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  // Atajo que se está por guardar: null = no estamos guardando nada.
  const [nuevoAtajo, setNuevoAtajo] = useState(null)
  const threadRef = useRef(null)
  const textareaRef = useRef(null)
  // Lo escrito y sin enviar en cada conversación, para poder ir y volver de la
  // lista sin perderlo. Vive en un ref: no hace falta re-renderizar por esto.
  const borradores = useRef({})
  const borradorVivo = useRef({ text: '', mode: 'mensaje' })
  const phoneAnterior = useRef(null)

  const phone = group?.phone
  const messageCount = group?.messages.length

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
    setSearch('')
    setSearchOpen(false)
    setMenuOpen(null)
    setSummaryOpen(false)
    setQuickOpen(false)
    setQuickIndex(0)
    setSlashSuprimido(false)
    setEmojiOpen(false)
    setNuevoAtajo(null)
  }, [phone])

  // El cuadro crece con lo que se escribe en vez de dejar el texto largo
  // metido en dos renglones con scroll. A partir del tope, scrollea.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  // Abrir una conversación deja el cursor listo para responder, que es a lo
  // que se viene. En pantallas chicas no, porque levantaría el teclado.
  useEffect(() => {
    if (!phone || disabled) return
    if (window.matchMedia?.('(hover: none)').matches) return
    textareaRef.current?.focus()
  }, [phone, disabled])

  if (!group) {
    return (
      <div className="animate-fade-in flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-[#0d0d0d] text-center">
        <IconInbox size={28} className="animate-pop-in text-white/25" style={{ '--d': '120ms' }} />
        <p className="animate-fade-up text-[13px] leading-relaxed text-white/35" style={{ '--d': '180ms' }}>
          Elegí una conversación de la lista
          <br />
          para ver el historial completo.
        </p>
      </div>
    )
  }

  const stage = LIFECYCLES.find((s) => s.key === group.lifecycle) ?? LIFECYCLES[0]
  const agent = findAgent(agents, group.agent)

  // Escribir "/" al principio del mensaje abre las respuestas rápidas y filtra
  // con lo que sigue, igual que en WhatsApp Business. El resto del texto no
  // dispara nada: solo cuenta si la barra arranca el mensaje.
  const slashQuery = draft.startsWith('/') ? draft.slice(1).trim().toLowerCase() : null
  const quickFiltradas = quickReplies.filter(
    (q) => !slashQuery || q.shortcut.includes(slashQuery) || q.text.toLowerCase().includes(slashQuery),
  )
  const quickPanelAbierto = (quickOpen || (slashQuery !== null && !slashSuprimido)) && !disabled

  const excedido = draft.length > MAX_CARACTERES
  const puedeEnviar = Boolean(draft.trim()) && !excedido && !disabled

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

  const insertarQuickReply = (quick) => {
    // Si la plantilla se disparó con "/", el comando es todo el mensaje y se
    // reemplaza. Si se abrió desde el botón, el texto ya escrito se respeta y
    // la plantilla entra donde está el cursor.
    if (slashQuery !== null) {
      setDraft(quick.text)
      enfocarEn(quick.text.length)
    } else {
      insertarEnCursor(quick.text)
    }
    setQuickOpen(false)
    setQuickIndex(0)
  }

  const guardarQuickReply = async () => {
    const atajo = String(nuevoAtajo ?? '').trim()
    const cuerpo = draft.trim()
    if (!atajo || !cuerpo || !onSaveQuickReply) return
    await onSaveQuickReply(atajo, cuerpo)
    setNuevoAtajo(null)
  }

  const handleSend = () => {
    const body = draft.trim()
    if (!body || disabled || excedido) return
    if (mode === 'nota') onAddNote(group.phone, body)
    else onSend(group.phone, body)
    setDraft('')
    setQuickOpen(false)
    setEmojiOpen(false)
    setQuickIndex(0)
    delete borradores.current[group.phone]
    enfocarEn(0)
  }

  const handleChange = (e) => {
    setDraft(e.target.value)
    // Volver a escribir después de esconder el panel con Escape lo trae de
    // nuevo: la sugerencia sigue siendo útil mientras se tipea el atajo.
    setSlashSuprimido(false)
    setQuickIndex(0)
  }

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + \ alterna entre responderle al cliente y dejar una nota
    // interna, sin sacar las manos del teclado ni perder lo escrito.
    if (e.key === '\\' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setMode((m) => (m === 'nota' ? 'mensaje' : 'nota'))
      return
    }
    if (e.key === 'Escape' && (quickPanelAbierto || emojiOpen)) {
      // Escape esconde el panel y nada más: lo escrito se conserva.
      e.preventDefault()
      setQuickOpen(false)
      setEmojiOpen(false)
      if (slashQuery !== null) setSlashSuprimido(true)
      return
    }

    // Con el panel abierto, ↑/↓ recorren las plantillas y Enter/Tab insertan
    // la resaltada, como en cualquier autocompletado.
    if (quickPanelAbierto && quickFiltradas.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const paso = e.key === 'ArrowDown' ? 1 : -1
        setQuickIndex((i) => (i + paso + quickFiltradas.length) % quickFiltradas.length)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        insertarQuickReply(quickFiltradas[quickIndex] ?? quickFiltradas[0])
        return
      }
      // Con el atajo a medio escribir, Enter inserta la respuesta en vez de
      // enviar: si no, al cliente le llegaría un "/envios" pelado.
      if (e.key === 'Enter' && !e.shiftKey && slashQuery !== null) {
        e.preventDefault()
        insertarQuickReply(quickFiltradas[quickIndex] ?? quickFiltradas[0])
        return
      }
    }

    // Enter envía, Shift+Enter hace salto de línea.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const usarSugerenciaIA = () => {
    if (!aiDraft) return
    setDraft(aiDraft.text)
    enfocarEn(aiDraft.text.length)
  }

  const query = search.trim().toLowerCase()
  const visibleMessages = query
    ? group.messages.filter((m) => m.text.toLowerCase().includes(query))
    : group.messages

  const entrantes = group.messages.filter((m) => m.direction === 'in')
  const primerContacto = entrantes[0]?.createdAt

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#0d0d0d]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2">
        {/* `overflow-hidden` es lo que evita que, con el panel de contacto
            abierto, el nombre y la etapa se monten sobre los botones de la
            derecha: acá el contenido se recorta, no se desborda. */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <Avatar name={group.customer} size={30} className="!rounded-full !text-[11px]" />
          <p className="max-w-[240px] shrink-0 truncate text-[13.5px] font-semibold text-white">
            {group.customer}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-1.5 py-[3px] text-[11px] text-white/65">
            <span className="leading-none">{stage.emoji}</span>
            {stage.label}
          </span>
          {/* El número es lo primero que cede el espacio: cuando el panel de
              contacto está abierto el header queda angosto, y el dato ya está
              ahí y en la lista. El nombre, en cambio, no se achica. */}
          <span className="hidden min-w-0 truncate text-[11.5px] tabular-nums text-white/30 lg:inline-block">
            {group.phone}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Responsable de la conversación. El menú asigna de verdad: es lo que
              distingue "alguien lo está viendo" de "nadie lo tomó". */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((m) => (m === 'asignar' ? null : 'asignar'))}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] text-white/60 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
            >
              {group.assignee ? (
                <Avatar name={group.assignee} size={18} className="!rounded-full !text-[9px]" />
              ) : (
                <IconUser size={14} />
              )}
              <span className="max-w-[90px] truncate capitalize">{group.assignee ?? 'Sin asignar'}</span>
              <IconChevronDown size={11} className={`transition-transform duration-300 ${menuOpen === 'asignar' ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen === 'asignar' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(null)} />
                <ul className="animate-scale-in absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#161616] py-1 shadow-xl">
                  <li>
                    <button
                      onClick={() => {
                        onAssign(group.phone, username)
                        setMenuOpen(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-white/75 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                    >
                      Asignármela a mí
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        onAssign(group.phone, null)
                        setMenuOpen(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-white/75 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                    >
                      Quitar asignación
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>

          <HeaderButton
            title="Buscar en la conversación"
            active={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v)
              if (searchOpen) setSearch('')
            }}
          >
            <IconSearch size={15} />
          </HeaderButton>
          <HeaderButton title="Resumen de la conversación" active={summaryOpen} onClick={() => setSummaryOpen((v) => !v)}>
            <IconClock size={15} />
          </HeaderButton>
          <a
            href={`tel:${group.phone.replace(/\s/g, '')}`}
            title="Llamar al contacto"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/45 transition-all duration-200 hover:bg-white/[0.07] hover:text-white active:scale-95"
          >
            <IconPhone size={15} />
          </a>

          <button
            onClick={() => onResolve(group.phone)}
            disabled={disabled || group.pendientes === 0}
            className="ml-1 flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-white/75
              transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.09] hover:text-white active:scale-[0.97]
              disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.04]"
          >
            <IconCheckCircle size={13} />
            Resolver
          </button>

          <div className="relative">
            <HeaderButton title="Más acciones" active={menuOpen === 'mas'} onClick={() => setMenuOpen((m) => (m === 'mas' ? null : 'mas'))}>
              <IconDots size={15} />
            </HeaderButton>
            {menuOpen === 'mas' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(null)} />
                <ul className="animate-scale-in absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#161616] py-1 shadow-xl">
                  <li>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(group.phone)
                        setMenuOpen(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-white/75 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                    >
                      Copiar número
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setMode('nota')
                        setMenuOpen(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-white/75 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                    >
                      Agregar nota interna
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setSummaryOpen(true)
                        setMenuOpen(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12px] text-white/75 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
                    >
                      Ver resumen
                    </button>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Buscador dentro del hilo: filtra los globos en vez de saltar de uno en
          uno, que es lo que sirve cuando buscás "reintegro" en una charla larga. */}
      <div
        className={`grid shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          searchOpen ? 'grid-rows-[1fr] border-b border-white/[0.07] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en esta conversación..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white placeholder:text-white/30
                transition-all duration-200 focus:border-white/25 focus:bg-white/[0.07] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {summaryOpen && (
        <div className="animate-fade-down shrink-0 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-white/45">
            <span>
              <span className="text-white/80">{group.total}</span> mensajes
            </span>
            <span>
              <span className="text-white/80">{group.pendientes}</span> pendientes
            </span>
            <span>
              <span className="text-white/80">{group.automaticos}</span> automáticos
            </span>
            <span>
              Atendida por <span className="text-white/80">{agent.name}</span>
            </span>
            {primerContacto && (
              <span>
                Primer contacto <span className="text-white/80">{formatTime(primerContacto)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* El hilo usa el ancho del panel y solo se centra en pantallas muy
          grandes, donde estirarlo de borde a borde dejaría la conversación
          desparramada. Por debajo de ese tope el padding es el normal. */}
      <ul
        ref={threadRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-[max(1.25rem,calc((100%-70rem)/2))] py-4"
      >
        {visibleMessages.map((message, i) => {
          const prev = visibleMessages[i - 1]
          const showDay = !prev || !sameDay(prev.createdAt, message.createdAt)

          return (
            <Fragment key={message.id}>
              {showDay && (
                <li className="flex justify-center py-1.5">
                  <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40 first-letter:uppercase">
                    {formatDayLabel(message.createdAt)}
                  </span>
                </li>
              )}
              <MessageBubble
                message={message}
                customer={group.customer}
                agentName={agent.name}
                fromEnd={visibleMessages.length - 1 - i}
              />
            </Fragment>
          )
        })}

        {visibleMessages.length === 0 && (
          <li className="animate-fade-in py-10 text-center text-[12.5px] text-white/35">
            Ningún mensaje coincide con “{search.trim()}”.
          </li>
        )}
      </ul>

      <div className="mx-auto w-full max-w-[70rem] shrink-0 border-t border-white/[0.07] px-4 py-2.5">
        {disabled ? (
          <p className="py-3 text-center text-[12px] text-white/35">{disabledMessage}</p>
        ) : (
          <div
            onClick={(e) => {
              // Click en cualquier lado del bloque (menos en un control) manda
              // el cursor al texto: el área clickeable es toda la caja.
              if (e.target === e.currentTarget) textareaRef.current?.focus()
            }}
            className={`relative rounded-xl border transition-colors duration-300 ${
              mode === 'nota'
                ? 'border-status-warning/30 bg-status-warning/[0.05] focus-within:border-status-warning/60'
                : excedido
                  ? 'border-status-critical/50 bg-white/[0.03]'
                  : 'border-white/10 bg-white/[0.03] focus-within:border-white/25 focus-within:bg-white/[0.05]'
            }`}
          >
            {/* Respuestas rápidas. Se abre con el botón de plantillas o
                escribiendo "/" al principio del mensaje. */}
            {quickPanelAbierto && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => {
                    setQuickOpen(false)
                    if (slashQuery !== null) setSlashSuprimido(true)
                  }}
                />
                <div className="animate-scale-in absolute bottom-full left-0 z-30 mb-2 w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#161616] shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/70">
                      <IconTemplate size={12} />
                      Respuestas rápidas
                    </span>
                    <span className="text-[11px] text-white/30">
                      {slashQuery !== null ? `filtrando “${slashQuery}”` : '↑↓ para elegir · Tab inserta'}
                    </span>
                  </div>

                  <ul className="max-h-60 overflow-y-auto py-1" role="listbox" aria-label="Respuestas rápidas">
                    {quickFiltradas.map((quick, i) => (
                      <li
                        key={quick.id}
                        role="option"
                        aria-selected={i === quickIndex}
                        onMouseEnter={() => setQuickIndex(i)}
                        className={`group/qr flex items-start gap-2 px-3 py-1.5 transition-colors duration-100 ${
                          i === quickIndex ? 'bg-white/[0.07]' : ''
                        }`}
                      >
                        <button
                          onClick={() => insertarQuickReply(quick)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block text-[11.5px] font-medium text-violet">/{quick.shortcut}</span>
                          <span className="block truncate text-[12px] text-white/60">{quick.text}</span>
                        </button>
                        {onDeleteQuickReply && (
                          <button
                            onClick={() => onDeleteQuickReply(quick.id)}
                            title="Eliminar respuesta rápida"
                            className="shrink-0 rounded px-1 text-[11px] text-white/25 opacity-0 transition-opacity duration-150 hover:text-status-critical group-hover/qr:opacity-100"
                          >
                            Eliminar
                          </button>
                        )}
                      </li>
                    ))}

                    {quickFiltradas.length === 0 && (
                      <li className="px-3 py-3 text-center text-[12px] text-white/35">
                        {quickReplies.length === 0
                          ? 'Todavía no guardaste ninguna respuesta rápida.'
                          : 'Ninguna coincide con lo que escribiste.'}
                      </li>
                    )}
                  </ul>

                  {/* Guardar lo que ya está escrito: es cuando más ganas dan de
                      tener el atajo, justo después de tipear el mensaje. */}
                  {onSaveQuickReply && draft.trim() && slashQuery === null && (
                    <div className="border-t border-white/[0.07] px-3 py-2">
                      {nuevoAtajo === null ? (
                        <button
                          onClick={() => setNuevoAtajo('')}
                          className="text-[11.5px] text-violet transition-colors duration-200 hover:text-violet/80"
                        >
                          + Guardar este mensaje como respuesta rápida
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-white/40">/</span>
                          <input
                            autoFocus
                            value={nuevoAtajo}
                            onChange={(e) => setNuevoAtajo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                guardarQuickReply()
                              }
                              if (e.key === 'Escape') setNuevoAtajo(null)
                            }}
                            placeholder="atajo"
                            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[12px] text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
                          />
                          <button
                            onClick={guardarQuickReply}
                            disabled={!nuevoAtajo.trim()}
                            className="rounded-md bg-white/[0.09] px-2 py-1 text-[11.5px] text-white/85 transition-colors duration-200 hover:bg-white/[0.14] disabled:opacity-35"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex items-center justify-between gap-2 px-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11.5px]">
                {mode === 'nota' ? (
                  <>
                    <IconNote size={13} className="text-status-warning" />
                    <span className="text-status-warning">Nota interna</span>
                    <span className="text-white/30">· solo la ve el equipo</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#25d366]">
                      <svg viewBox="0 0 24 24" className="h-2 w-2 fill-black/80">
                        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.9-5.1c-.4-.7-.7-1.5-.7-2.2s.4-1.2.7-1.4c.2-.2.4-.2.6-.2h.4c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.5.9 1.6 1.9 2.6 2.4.2.1.4.1.5 0l.7-.8c.2-.2.3-.2.5-.1l1.7.9c.2.1.3.2.4.3v.8Z" />
                      </svg>
                    </span>
                    <span className="text-white/60">Canal de WhatsApp</span>
                  </>
                )}
              </div>
              <button
                onClick={usarSugerenciaIA}
                disabled={!aiDraft}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-violet transition-colors duration-200 hover:bg-violet-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconSparkles size={12} />
                Asistente IA
              </button>
            </div>

            {/* Sugerencia de la IA: la clasificación no fue lo bastante segura
                para auto-enviar, así que queda acá para que el admin la revise
                y la mande con un click (o la edite antes). */}
            {aiDraft && !draft && (
              <div className="mx-3 mb-2 rounded-lg border border-violet/25 bg-violet-soft px-3 py-2">
                <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-violet">
                  <IconSparkles size={11} />
                  Sugerencia de IA
                </p>
                <p className="text-[12.5px] leading-snug text-white/80">{aiDraft.text}</p>
                <button
                  onClick={usarSugerenciaIA}
                  className="mt-1.5 rounded-md border border-violet/30 px-2 py-0.5 text-[11px] font-medium text-violet transition-colors duration-200 hover:bg-violet/10"
                >
                  Usar sugerencia
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              aria-label={mode === 'nota' ? 'Nota interna' : 'Mensaje para el cliente'}
              placeholder={
                mode === 'nota'
                  ? 'Escribí una nota para el equipo...'
                  : 'Escribí un mensaje...  (/ para respuestas rápidas)'
              }
              className="max-h-40 min-h-[2.5rem] w-full resize-none overflow-y-auto bg-transparent px-3 py-2 text-[13px] leading-snug text-white placeholder:text-white/30 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <ComposerButton
                    title="Emoji"
                    active={emojiOpen}
                    onClick={() => setEmojiOpen((v) => !v)}
                  >
                    <IconSmile size={15} />
                  </ComposerButton>
                  {emojiOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setEmojiOpen(false)} />
                      {/* El emoji entra donde está el cursor, no al final: se
                          usa tanto para abrir un saludo como para cerrar. */}
                      <div className="animate-scale-in absolute bottom-full left-0 z-30 mb-2 grid w-64 grid-cols-8 gap-0.5 rounded-xl border border-white/10 bg-[#161616] p-2 shadow-xl">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => insertarEnCursor(emoji)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[15px] leading-none transition-colors duration-150 hover:bg-white/[0.09]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <ComposerButton title="Adjuntar archivo"><IconPaperclip size={15} /></ComposerButton>
                <ComposerButton
                  title="Respuestas rápidas (escribí / en el mensaje)"
                  active={quickPanelAbierto}
                  onClick={() => {
                    setSlashSuprimido(false)
                    setQuickIndex(0)
                    setQuickOpen((v) => !v)
                  }}
                >
                  <IconTemplate size={15} />
                </ComposerButton>
                <ComposerButton title="Audio"><IconMic size={15} /></ComposerButton>
                <ComposerButton
                  title="Cambiar a nota interna (Ctrl + \)"
                  active={mode === 'nota'}
                  onClick={() => setMode((m) => (m === 'nota' ? 'mensaje' : 'nota'))}
                >
                  <IconNote size={15} />
                </ComposerButton>
              </div>

              <div className="flex items-center gap-2">
                {/* El contador aparece recién cerca del límite: mostrarlo
                    siempre sería ruido, un mensaje de atención rara vez pasa
                    de un par de renglones. */}
                {draft.length > MAX_CARACTERES - 400 && (
                  <span
                    className={`text-[11px] tabular-nums ${excedido ? 'text-status-critical' : 'text-white/40'}`}
                  >
                    {draft.length} / {MAX_CARACTERES}
                  </span>
                )}
                <span className="hidden text-[11px] text-white/25 sm:inline">
                  {draft.trim()
                    ? 'Enter envía · Shift + Enter salta línea'
                    : `Ctrl + \\ para ${mode === 'nota' ? 'volver al mensaje' : 'nota interna'}`}
                </span>
                <button
                  onClick={handleSend}
                  disabled={!puedeEnviar}
                  title={
                    excedido
                      ? `El mensaje supera los ${MAX_CARACTERES} caracteres`
                      : mode === 'nota'
                        ? 'Guardar nota (Enter)'
                        : 'Enviar mensaje (Enter)'
                  }
                  aria-label={mode === 'nota' ? 'Guardar nota' : 'Enviar mensaje'}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
                    active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
                      mode === 'nota'
                        ? 'bg-status-warning text-black hover:bg-status-warning/85'
                        : 'bg-accent-gradient text-white hover:shadow-glow'
                    }`}
                >
                  <IconSend size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
