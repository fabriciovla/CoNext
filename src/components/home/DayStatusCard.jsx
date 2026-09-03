import Card from '../ui/Card'
import Button from '../ui/Button'
import { IconArchive, IconClock } from '../ui/icons'
import { storeSchedule } from '../../utils/metrics'
import { formatTime } from '../../utils/time'
import { useT } from '../../lib/i18n.jsx'

// El motivo que devuelve `storeSchedule` es una clave, no una frase: acá se
// traduce a la del idioma puesto.
const SCHEDULE_TEXT = {
  abierto: 'inicio.horarioAtendiendo',
  'antes-de-abrir': 'inicio.horarioNoAbriste',
  'ya-cerro': 'inicio.horarioFuera',
  'no-laborable': 'inicio.horarioNoLaborable',
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
  const t = useT()
  const isOpen = dayStatus === 'open'
  const schedule = storeSchedule(settings)

  return (
    <Card title={t('inicio.estadoDelDia')}>
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
        <p className="text-sm font-medium text-ink-primary">
          {isOpen ? t('dia.abierto') : t('dia.cerrado')}
        </p>
        <span className="text-xs text-ink-muted">
          {isOpen
            ? t('dia.desdeLas', { hora: formatTime(dayOpenedAt) })
            : dayClosedAt
              ? t('dia.alas', { hora: formatTime(dayClosedAt) })
              : ''}
        </span>
      </div>

      <dl className="stagger mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-ink-muted">
            <IconClock size={13} />
            {t('inicio.horarioDeAtencion')}
          </dt>
          <dd className="tabular-nums text-ink-secondary">
            {schedule.hours
              ? `${schedule.hours.openTime} – ${schedule.hours.closeTime}`
              : schedule.isOpen
                ? t('inicio.turnoAnterior')
                : t('inicio.cerradoHoy')}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">
            {t('inicio.segunConfiguracion', { dia: t(`diasCorto.${schedule.today}`) })}
          </dt>
          <dd className={schedule.isOpen ? 'font-medium text-status-good' : 'text-ink-secondary'}>
            {t(SCHEDULE_TEXT[schedule.reason])}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">{t('inicio.mensajesEnBandeja')}</dt>
          <dd className="tabular-nums text-ink-secondary">{messageCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-ink-muted">
            <IconArchive size={13} />
            {t('inicio.diasArchivados')}
          </dt>
          <dd className="tabular-nums text-ink-secondary">{archivedDays.length}</dd>
        </div>
      </dl>

      <div className="animate-fade-up mt-4 flex gap-2" style={{ '--d': '340ms' }}>
        {isOpen ? (
          <Button size="sm" variant="secondary" onClick={() => onNavigate('inbox')}>
            {t('inicio.irALaBandeja')}
          </Button>
        ) : (
          <Button size="sm" onClick={onOpenNewDay}>
            {t('dia.abrirNuevo')}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onNavigate('settings')}>
          {t('inicio.editarHorarios')}
        </Button>
      </div>
    </Card>
  )
}
