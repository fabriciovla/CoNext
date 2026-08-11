import { useState } from 'react'
import SideNav, { NavRow, NavSection } from '../SideNav'
import { LIFECYCLES } from '../../data/mockData'
import { IconInbox, IconUser, IconUsers, IconClock, IconBlock, IconArchive } from '../ui/icons'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

// La bandeja no tiene barra propia: cuelga sus carpetas, sus agentes y su ciclo
// de vida de la única barra de navegación de la app.
export default function InboxNav({
  groups,
  agents = [],
  username = 'admin',
  filter,
  onFilterChange,
  archivedDays,
  viewingDayId,
  onSelectDay,
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  onCloseDay,
  onOpenNewDay,
  onCollapse,
  current,
  onNavigate,
  onLogout,
  pendingCount,
}) {
  const [openSections, setOpenSections] = useState({
    carpetas: true,
    agentes: true,
    ciclo: true,
    dias: false,
  })
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const is = (type, value = null) => filter.type === type && filter.value === value
  const select = (type, value = null) => onFilterChange({ type, value })

  const pendientes = groups.filter((g) => g.pendientes > 0).length
  const mios = groups.filter((g) => g.assignee === username).length
  const sinAsignar = groups.filter((g) => g.assignee === null).length
  const countBy = (key, value) => groups.filter((g) => g[key] === value).length

  const dayOpen = dayStatus === 'open'

  return (
    <SideNav
      current={current}
      onNavigate={onNavigate}
      username={username}
      onLogout={onLogout}
      pendingCount={pendingCount}
      onCollapse={onCollapse}
      footer={
        // Estado del día: define si se puede responder, así que vive fijo abajo
        // y no se va con el scroll de las carpetas.
        <div className="shrink-0 border-t border-white/[0.07] px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              {dayOpen && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-status-good" />}
              <span
                className={`relative h-2 w-2 rounded-full ${
                  dayOpen ? 'bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]' : 'bg-white/30'
                }`}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-white/85">
                {dayOpen ? 'Día abierto' : 'Día cerrado'}
              </p>
              <p className="truncate text-[10.5px] text-white/35">
                {dayOpen ? `desde ${formatTime(dayOpenedAt)}` : `a las ${formatTime(dayClosedAt)}`}
              </p>
            </div>
          </div>
          <button
            onClick={dayOpen ? onCloseDay : onOpenNewDay}
            className={`w-full rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${
              dayOpen
                ? 'border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.09] hover:text-white'
                : 'bg-white text-black hover:bg-white/85'
            }`}
          >
            {dayOpen ? 'Cerrar día' : 'Abrir nuevo día'}
          </button>
        </div>
      }
    >
      <NavSection title="Carpetas" open={openSections.carpetas} onToggle={() => toggleSection('carpetas')}>
        <NavRow
          icon={<IconInbox size={16} />}
          label="Todas"
          count={groups.length}
          active={is('todos')}
          onClick={() => select('todos')}
        />
        <NavRow
          icon={<IconUser size={16} />}
          label="Mías"
          count={mios}
          active={is('mios')}
          onClick={() => select('mios')}
        />
        <NavRow
          icon={<IconUsers size={16} />}
          label="Sin asignar"
          count={sinAsignar}
          active={is('sinAsignar')}
          onClick={() => select('sinAsignar')}
        />
        <NavRow
          icon={<IconClock size={16} />}
          label="Pendientes"
          count={pendientes}
          active={is('pendientes')}
          onClick={() => select('pendientes')}
        />
      </NavSection>

      <NavSection title="Agentes IA" open={openSections.agentes} onToggle={() => toggleSection('agentes')}>
        {agents.map((agent) => (
          <NavRow
            key={agent.key}
            emoji={agent.emoji}
            label={agent.name}
            count={countBy('agent', agent.key)}
            active={is('agente', agent.key)}
            onClick={() => select('agente', agent.key)}
          />
        ))}
      </NavSection>

      <NavSection title="Ciclo de vida" open={openSections.ciclo} onToggle={() => toggleSection('ciclo')}>
        {LIFECYCLES.map((stage) => (
          <NavRow
            key={stage.key}
            emoji={stage.emoji}
            label={stage.label}
            count={countBy('lifecycle', stage.key)}
            active={is('etapa', stage.key)}
            onClick={() => select('etapa', stage.key)}
          />
        ))}
      </NavSection>

      <NavSection title="Días archivados" open={openSections.dias} onToggle={() => toggleSection('dias')}>
        {archivedDays.length === 0 ? (
          <p className="px-2.5 py-2 text-[11px] leading-relaxed text-white/30">
            Todavía no cerraste ningún día.
          </p>
        ) : (
          archivedDays.map((day) => {
            const entrantes = day.messages.filter((m) => m.direction === 'in')
            return (
              <NavRow
                key={day.id}
                icon={<IconArchive size={16} />}
                label={`${formatDate(day.openedAt)} · ${formatTime(day.openedAt)}`}
                count={entrantes.length}
                active={viewingDayId === day.id}
                onClick={() => onSelectDay(day)}
              />
            )
          })
        )}
      </NavSection>

      <div className="mt-3 border-t border-white/[0.07] pt-2">
        <NavRow icon={<IconBlock size={16} />} label="Contactos bloqueados" />
      </div>
    </SideNav>
  )
}
