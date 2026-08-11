import Card from '../ui/Card'
import Button from '../ui/Button'
import { IconArchive, IconClock } from '../ui/icons'
import { storeSchedule } from '../../utils/metrics'

const SCHEDULE_TEXT = {
  abierto: 'Atendiendo ahora',
  'antes-de-abrir': 'Todavía no abriste',
  'ya-cerro': 'Fuera de horario',
  'no-laborable': 'Hoy no se atiende',
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function DayStatusCard({
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  messageCount,
  archivedDays,
  settings,
  onOpenNewDay,
  onNavigate,
}) {
  const isOpen = dayStatus === 'open'
  const schedule = storeSchedule(settings)

  return (
    <Card title="Estado del día">
      <div className="animate-fade-in flex items-center gap-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          {/* Halo que late solo mientras el día está abierto: dice "en vivo". */}
          {isOpen && (
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-status-good" />
          )}
          <span
            className={`relative h-2 w-2 rounded-full ${
              isOpen ? 'bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]' : 'bg-ink-muted'
            }`}
          />
        </span>
        <p className="text-sm font-medium text-ink-primary">{isOpen ? 'Día abierto' : 'Día cerrado'}</p>
        <span className="text-xs text-ink-muted">
          {isOpen ? `desde las ${formatTime(dayOpenedAt)}` : dayClosedAt ? `a las ${formatTime(dayClosedAt)}` : ''}
        </span>
      </div>

      <dl className="stagger mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-ink-muted">
            <IconClock size={13} />
            Horario de atención
          </dt>
          <dd className="tabular-nums text-ink-secondary">
            {settings.openTime} – {settings.closeTime}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">{schedule.today}, según tu configuración</dt>
          <dd className={schedule.isOpen ? 'font-medium text-status-good' : 'text-ink-secondary'}>
            {SCHEDULE_TEXT[schedule.reason]}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">Mensajes en la bandeja</dt>
          <dd className="tabular-nums text-ink-secondary">{messageCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-ink-muted">
            <IconArchive size={13} />
            Días archivados
          </dt>
          <dd className="tabular-nums text-ink-secondary">{archivedDays.length}</dd>
        </div>
      </dl>

      <div className="animate-fade-up mt-4 flex gap-2" style={{ '--d': '340ms' }}>
        {isOpen ? (
          <Button size="sm" variant="secondary" onClick={() => onNavigate('inbox')}>
            Ir a la bandeja
          </Button>
        ) : (
          <Button size="sm" onClick={onOpenNewDay}>
            Abrir nuevo día
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onNavigate('settings')}>
          Editar horarios
        </Button>
      </div>
    </Card>
  )
}
