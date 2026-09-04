import { useState } from 'react'
import SideNav, { NavRow, NavSection } from './SideNav'
import {
  IconUser,
  IconUsers,
  IconClock,
  IconBlock,
  IconArchive,
  IconPlus,
} from './ui/icons'
import { formatTime as horaDe } from '../utils/time'
import { useIdioma } from '../lib/i18n.jsx'

// Acá el argumento puede venir en null (un día que todavía no se abrió), así
// que el helper compartido se envuelve en vez de usarse pelado.
function formatTime(iso) {
  return iso ? horaDe(iso) : null
}

// El mes abreviado sale del locale activo: en español es "27 ago" y en inglés
// "Aug 27", incluido el orden, que no se arma concatenando a mano.
function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

// Barra de navegación de toda la app, no solo de la bandeja: las secciones
// (Inicio, Bandeja, Agentes…), las carpetas, los agentes, los días archivados y
// el estado del día se ven igual en cualquier página. Antes esto colgaba de la
// bandeja y la columna cambiaba de forma al navegar.
//
// Elegir una carpeta es siempre una pregunta sobre la bandeja, así que desde
// otra página el click lleva a la bandeja con el filtro ya aplicado (eso lo
// resuelve `onFilterChange` en App).
export default function AppNav({
  groups,
  agents = [],
  username = 'admin',
  storeName,
  filter,
  onFilterChange,
  onOpenAgent,
  onNewAgent,
  archivedDays,
  viewingDayId,
  onSelectDay,
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  onCloseDay,
  onOpenNewDay,
  current,
  onNavigate,
  onLogout,
  pendingCount,
  theme,
  onToggleTheme,
}) {
  const { t, locale } = useIdioma()
  const [openSections, setOpenSections] = useState({
    carpetas: true,
    agentes: true,
    dias: false,
  })
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  // Un filtro solo se ve "elegido" estando en la bandeja: desde Inicio la
  // carpeta activa no describe nada de lo que hay en pantalla.
  const enBandeja = current === 'inbox'
  const is = (type, value = null) => enBandeja && filter.type === type && filter.value === value
  const select = (type, value = null) => onFilterChange({ type, value })

  // "Bandeja" es ahora la carpeta "Todas": tocarla no solo cambia de página,
  // también deja puesto ese filtro, que es lo que antes hacía la fila que
  // vivía en CARPETAS.
  const handleNavigate = (key) => (key === 'inbox' ? select('todos') : onNavigate(key))

  const pendientes = groups.filter((g) => g.pendientes > 0).length
  const mios = groups.filter((g) => g.assignee === username).length
  const sinAsignar = groups.filter((g) => g.assignee === null).length
  const countBy = (key, value) => groups.filter((g) => g[key] === value).length

  const dayOpen = dayStatus === 'open'
  const desde = formatTime(dayOpenedAt)
  const hasta = formatTime(dayClosedAt)

  return (
    <SideNav
      current={current}
      onNavigate={handleNavigate}
      username={username}
      storeName={storeName}
      onLogout={onLogout}
      pendingCount={pendingCount}
      theme={theme}
      onToggleTheme={onToggleTheme}
      inboxActive={is('todos')}
      footer={
        // Estado del día: define si se puede responder, así que vive fijo abajo
        // y no se va con el scroll de las carpetas.
        <div data-tour="nav-dia" className="shrink-0 border-t border-tint/[0.07] px-3 py-3">
          {/* El punto y el texto se centran como un bloque: el botón de abajo
              ocupa el ancho entero, así que un rótulo pegado a la izquierda
              quedaba descolgado de lo que rotula. */}
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              {dayOpen && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-status-good" />}
              <span
                className={`relative h-2 w-2 rounded-full ${
                  dayOpen ? 'bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]' : 'bg-tint/30'
                }`}
              />
            </span>
            <p className="truncate text-[12px] font-medium text-ink-primary">
              {dayOpen ? t('dia.abierto') : t('dia.cerrado')}
            </p>
            {/* La hora va al lado y no debajo: es una sola línea corta y así el
                pie ocupa un renglón menos. Sin hora todavía (primer render,
                antes de que conteste /days/current) no se inventa una:
                `new Date(null)` cae en el epoch y mostraría una hora falsa. */}
            <span className="truncate text-[10.5px] text-ink-faint">
              {dayOpen
                ? desde
                  ? t('dia.desde', { hora: desde })
                  : t('dia.enCurso')
                : hasta
                  ? t('dia.alas', { hora: hasta })
                  : '—'}
            </span>
          </div>
          <button
            onClick={dayOpen ? onCloseDay : onOpenNewDay}
            className={`w-full rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              dayOpen
                ? 'border border-tint/10 bg-tint/[0.04] text-ink-secondary hover:bg-tint/[0.09] hover:text-ink-primary'
                : 'bg-violet text-ink-inverted hover:bg-violet/90'
            }`}
          >
            {dayOpen ? t('dia.cerrarDia') : t('dia.abrirNuevo')}
          </button>
        </div>
      }
    >
      <NavSection title={t('nav.carpetas')} open={openSections.carpetas} onToggle={() => toggleSection('carpetas')}>
        <NavRow
          icon={<IconUser size={16} />}
          label={t('nav.mias')}
          count={mios}
          active={is('mios')}
          onClick={() => select('mios')}
        />
        <NavRow
          icon={<IconUsers size={16} />}
          label={t('nav.sinAsignar')}
          count={sinAsignar}
          active={is('sinAsignar')}
          onClick={() => select('sinAsignar')}
        />
        <NavRow
          icon={<IconClock size={16} />}
          label={t('nav.pendientes')}
          count={pendientes}
          active={is('pendientes')}
          onClick={() => select('pendientes')}
        />
      </NavSection>

      {/* Los agentes no son una carpeta más: entrar a uno abre su configuración
          (cuándo interviene, cómo responde, si manda solo). El número sigue
          siendo cuántas conversaciones está atendiendo. */}
      <NavSection title={t('nav.agents')} open={openSections.agentes} onToggle={() => toggleSection('agentes')}>
        {agents.map((agent) => (
          <NavRow
            key={agent.key}
            // Un punto en lugar del ícono: dice lo único que importa de un
            // vistazo (si está contestando o no) y ocupa el mismo ancho que los
            // íconos de las otras filas, así los nombres siguen alineados.
            icon={
              <span className="flex w-4 justify-center">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${agent.enabled ? 'bg-status-good' : 'bg-tint/30'}`}
                />
              </span>
            }
            label={agent.name}
            count={countBy('agent', agent.key)}
            onClick={() => onOpenAgent(agent)}
          />
        ))}
        <NavRow icon={<IconPlus size={16} />} label={t('nav.nuevoAgente')} onClick={onNewAgent} />
      </NavSection>

      <NavSection title={t('nav.diasArchivados')} open={openSections.dias} onToggle={() => toggleSection('dias')}>
        {archivedDays.length === 0 ? (
          <p className="px-2.5 py-2 text-[11px] leading-relaxed text-ink-faint">
            {t('nav.sinDiasCerrados')}
          </p>
        ) : (
          archivedDays.map((day) => {
            const entrantes = day.messages.filter((m) => m.direction === 'in')
            return (
              <NavRow
                key={day.id}
                icon={<IconArchive size={16} />}
                label={`${formatDate(day.openedAt, locale)} · ${formatTime(day.openedAt)}`}
                count={entrantes.length}
                active={enBandeja && viewingDayId === day.id}
                onClick={() => onSelectDay(day)}
              />
            )
          })
        )}
      </NavSection>

      <div className="mt-3 border-t border-tint/[0.07] pt-2">
        <NavRow icon={<IconBlock size={16} />} label={t('nav.bloqueados')} />
      </div>
    </SideNav>
  )
}
