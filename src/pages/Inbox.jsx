import { useEffect, useMemo, useState } from 'react'
import InboxNav from '../components/inbox/InboxNav'
import ConversationList from '../components/inbox/ConversationList'
import ChatPanel from '../components/inbox/ChatPanel'
import ContactSidebar from '../components/inbox/ContactSidebar'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { IconArchive } from '../components/ui/icons'
import { groupMessagesByPhone } from '../utils/groupMessages'
import useQuickReplies from '../hooks/useQuickReplies'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function Inbox({
  messages,
  focusPhone = null,
  username = 'admin',
  onNavigate,
  onLogout,
  pendingStat = 0,
  assignments,
  conversationsMeta,
  drafts,
  agents = [],
  onAssign,
  onChangeAgent,
  onAddTag,
  onRemoveTag,
  onResolveConversation,
  onSend,
  onAddNote,
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  archivedDays,
  onCloseDay,
  onOpenNewDay,
}) {
  const [filter, setFilter] = useState({ type: 'todos', value: null })
  const [unreplied, setUnreplied] = useState(false)
  const [orden, setOrden] = useState('recientes')
  const [search, setSearch] = useState('')
  const [selectedPhone, setSelectedPhone] = useState(focusPhone)
  const [viewingDayId, setViewingDayId] = useState(null)
  const [navOpen, setNavOpen] = useState(true)
  const [confirmClose, setConfirmClose] = useState(false)
  // Las respuestas rápidas viven acá y no en App porque solo las usa el
  // composer de la bandeja.
  const { quickReplies, addQuickReply, deleteQuickReply } = useQuickReplies()

  // Si se llegó acá pidiendo una conversación puntual (por ejemplo desde los
  // pendientes de Inicio), se abre esa y no la primera de la lista, y se
  // suelta cualquier día archivado que se estuviera mirando.
  useEffect(() => {
    if (focusPhone) {
      setViewingDayId(null)
      setFilter({ type: 'todos', value: null })
      setSelectedPhone(focusPhone)
    }
  }, [focusPhone])

  // Un día archivado se navega igual que el día en vivo: mismas carpetas, misma
  // lista y mismo panel de chat, solo que de solo lectura.
  const viewingDay = archivedDays.find((d) => d.id === viewingDayId) ?? null
  const activeMessages = viewingDay ? viewingDay.messages : messages

  const allGroups = useMemo(
    () => groupMessagesByPhone(activeMessages, assignments, conversationsMeta),
    [activeMessages, assignments, conversationsMeta],
  )

  // Se filtra por conversación, no por mensaje suelto: si un contacto tiene algo
  // pendiente querés ver su hilo entero, no el globo aislado.
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()

    const matchesFolder = (g) => {
      switch (filter.type) {
        case 'mios':
          return g.assignee === username
        case 'sinAsignar':
          return g.assignee === null
        case 'pendientes':
          return g.pendientes > 0
        case 'agente':
          return g.agent === filter.value
        case 'etapa':
          return g.lifecycle === filter.value
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
        g.phone.toLowerCase().includes(query) ||
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
  const pendingCount = messages.filter(
    (m) => m.direction === 'in' && m.status === 'pendiente',
  ).length

  const handleSelectDay = (day) => {
    setViewingDayId((prev) => (prev === day.id ? null : day.id))
  }

  const handleConfirmClose = () => {
    onCloseDay()
    setConfirmClose(false)
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* La columna de carpetas se colapsa animando el ancho del contenedor:
          desmontarla cortaría la transición en seco. */}
      <div
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          navOpen ? 'w-[248px]' : 'w-0'
        }`}
      >
        <InboxNav
          groups={allGroups}
          agents={agents}
          username={username}
          current="inbox"
          onNavigate={onNavigate}
          onLogout={onLogout}
          pendingCount={pendingStat}
          filter={filter}
          onFilterChange={setFilter}
          archivedDays={archivedDays}
          viewingDayId={viewingDayId}
          onSelectDay={handleSelectDay}
          dayStatus={dayStatus}
          dayOpenedAt={dayOpenedAt}
          dayClosedAt={dayClosedAt}
          onCloseDay={() => setConfirmClose(true)}
          onOpenNewDay={onOpenNewDay}
          onCollapse={() => setNavOpen(false)}
        />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {viewingDay && (
          <div className="animate-fade-down flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2">
            <div className="flex items-center gap-2.5 text-[12.5px]">
              <IconArchive size={14} className="shrink-0 text-white/40" />
              <span className="font-medium text-white">Día archivado</span>
              <span className="text-white/40">
                {formatDate(viewingDay.openedAt)} · {formatTime(viewingDay.openedAt)}–
                {formatTime(viewingDay.closedAt)}
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setViewingDayId(null)}>
              Volver a hoy
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <ConversationList
            groups={groups}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
            unreplied={unreplied}
            onUnrepliedChange={setUnreplied}
            orden={orden}
            onOrdenChange={setOrden}
            search={search}
            onSearchChange={setSearch}
            onExpandNav={navOpen ? null : () => setNavOpen(true)}
          />
          <ChatPanel
            group={selected}
            agents={agents}
            username={username}
            aiDraft={selected ? drafts[selected.phone] : undefined}
            quickReplies={quickReplies}
            onSaveQuickReply={addQuickReply}
            onDeleteQuickReply={deleteQuickReply}
            onSend={onSend}
            onAddNote={onAddNote}
            onResolve={onResolveConversation}
            onAssign={onAssign}
            disabled={Boolean(viewingDay) || dayStatus !== 'open'}
            disabledMessage={
              viewingDay
                ? 'Estás viendo un día archivado, es de solo lectura.'
                : 'El día está cerrado. Abrí un nuevo día para responder.'
            }
          />
          <ContactSidebar
            group={selected}
            agents={agents}
            onChangeAgent={onChangeAgent}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        </div>
      </div>

      {confirmClose && (
        <Modal title="Cerrar día" onClose={() => setConfirmClose(false)}>
          <p className="text-sm text-ink-secondary">
            Se van a archivar {messages.length} mensaje{messages.length === 1 ? '' : 's'} de hoy
            {pendingCount > 0
              ? `, incluyendo ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''} de revisión`
              : ''}
            . La bandeja va a quedar vacía hasta que abras un nuevo día.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmClose(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmClose}>Cerrar día</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
