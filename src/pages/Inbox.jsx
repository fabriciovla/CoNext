import { useEffect, useMemo, useState } from 'react'
import ConversationList from '../components/inbox/ConversationList'
import ChatPanel from '../components/inbox/ChatPanel'
import ContactSidebar from '../components/inbox/ContactSidebar'
import Button from '../components/ui/Button'
import { IconArchive } from '../components/ui/icons'
import { phoneDigits } from '../utils/phone'
import { formatTime } from '../utils/time'
import { useIdioma } from '../lib/i18n.jsx'

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'long' })
}

// Las columnas de la bandeja. La barra de carpetas ya no es de esta página: vive
// en `AppNav` y se ve en toda la app, así que el filtro y el día que se está
// mirando llegan como props desde App.
export default function Inbox({
  allGroups,
  cargando = false,
  filter,
  viewingDay = null,
  onLeaveDay,
  focusPhone = null,
  username = 'admin',
  drafts,
  agents = [],
  onAssign,
  onChangeAgent,
  onAddTag,
  onRemoveTag,
  onResolveConversation,
  onSend,
  onSendMedia,
  onAddNote,
  dayStatus,
}) {
  const { t, locale } = useIdioma()
  const [unreplied, setUnreplied] = useState(false)
  const [orden, setOrden] = useState('recientes')
  const [search, setSearch] = useState('')
  const [selectedPhone, setSelectedPhone] = useState(focusPhone)
  // Búsqueda dentro del hilo abierto. Vive acá y no en ChatPanel porque el
  // input está en la ficha de contacto y el filtrado pasa en el panel del chat:
  // son dos hermanos, así que el estado tiene que estar arriba de los dos.
  const [chatSearch, setChatSearch] = useState('')

  // Si se llegó acá pidiendo una conversación puntual (por ejemplo desde los
  // pendientes de Inicio), se abre esa y no la primera de la lista. El filtro y
  // el día archivado los suelta `navigate` en App, que es quien los tiene.
  useEffect(() => {
    if (focusPhone) setSelectedPhone(focusPhone)
  }, [focusPhone])

  // Se filtra por conversación, no por mensaje suelto: si un contacto tiene algo
  // pendiente querés ver su hilo entero, no el globo aislado.
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    // El número se busca por dígitos y no como texto: en pantalla se ve
    // `+54 (381) 234-5678`, así que tipear "381 234" tiene que encontrarlo
    // igual que "3812345" o que el `wa_id` crudo que hay guardado.
    const queryDigits = phoneDigits(query)

    const matchesFolder = (g) => {
      switch (filter.type) {
        case 'mios':
          return g.assignee === username
        case 'sinAsignar':
          return g.assignee === null
        case 'pendientes':
          return g.pendientes > 0
        default:
          return true
      }
    }

    const filtered = allGroups.filter((g) => {
      if (!matchesFolder(g)) return false
      // "Sin responder" = lo último lo dijo el cliente y sigue esperando.
      if (unreplied && g.lastFromStore) return false
      if (!query) return true
      return (
        g.customer.toLowerCase().includes(query) ||
        (queryDigits !== '' && phoneDigits(g.phone).includes(queryDigits)) ||
        // Las etiquetas ya vienen normalizadas en minúscula desde el servidor,
        // así que buscar "mayorista" filtra la bandeja por esa etiqueta sin
        // necesidad de un selector aparte.
        (g.tags ?? []).some((t) => t.includes(query)) ||
        g.messages.some((m) => m.text.toLowerCase().includes(query))
      )
    })

    if (orden === 'antiguas') return [...filtered].reverse()
    if (orden === 'pendientes') {
      return [...filtered].sort(
        (a, b) => b.pendientes - a.pendientes || new Date(b.lastAt) - new Date(a.lastAt),
      )
    }
    return filtered
  }, [allGroups, filter, unreplied, orden, search, username])

  // Mantiene una conversación abierta siempre que haya alguna visible, y suelta
  // la selección si el filtro (o el cierre del día) la dejó fuera de la lista.
  // La dependencia va sobre los teléfonos y no sobre `groups`, que es un array
  // nuevo en cada render y dispararía el efecto de más.
  const phoneKey = groups.map((g) => g.phone).join('|')
  useEffect(() => {
    if (groups.length === 0) {
      if (selectedPhone !== null) setSelectedPhone(null)
      return
    }
    if (!groups.some((g) => g.phone === selectedPhone)) {
      setSelectedPhone(groups[0].phone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneKey, selectedPhone])

  const selected = groups.find((g) => g.phone === selectedPhone) ?? null

  // Cambiar de conversación limpia la búsqueda del hilo: lo que buscabas en una
  // charla no tiene por qué esconder mensajes de la siguiente.
  useEffect(() => {
    setChatSearch('')
  }, [selectedPhone])

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      {viewingDay && (
        <div className="animate-fade-down flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-tint/[0.07] bg-tint/[0.03] px-4 py-2">
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <IconArchive size={14} className="shrink-0 text-ink-muted" />
            <span className="font-medium text-ink-primary">{t('bandeja.diaArchivado')}</span>
            <span className="text-ink-muted">
              {formatDate(viewingDay.openedAt, locale)} · {formatTime(viewingDay.openedAt)}–
              {formatTime(viewingDay.closedAt)}
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={onLeaveDay}>
            {t('bandeja.volverAHoy')}
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <ConversationList
          groups={groups}
          cargando={cargando}
          selectedPhone={selectedPhone}
          onSelect={setSelectedPhone}
          unreplied={unreplied}
          onUnrepliedChange={setUnreplied}
          orden={orden}
          onOrdenChange={setOrden}
          search={search}
          onSearchChange={setSearch}
        />
        <ChatPanel
          group={selected}
          agents={agents}
          aiDraft={selected ? drafts[selected.phone] : undefined}
          search={chatSearch}
          onSend={onSend}
          onSendMedia={onSendMedia}
          onAddNote={onAddNote}
          disabled={Boolean(viewingDay) || dayStatus !== 'open'}
          disabledMessage={
            viewingDay ? t('bandeja.soloLectura') : t('bandeja.diaCerrado')
          }
        />
        {/* Asignar, resolver y buscar en el hilo salieron del header del chat y
            viven acá: la ficha está siempre a la vista y era el mismo dato dos
            veces en pantalla. */}
        <ContactSidebar
          group={selected}
          agents={agents}
          username={username}
          disabled={Boolean(viewingDay) || dayStatus !== 'open'}
          search={chatSearch}
          onSearchChange={setChatSearch}
          onChangeAgent={onChangeAgent}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onAssign={onAssign}
          onResolve={onResolveConversation}
        />
      </div>
    </div>
  )
}
