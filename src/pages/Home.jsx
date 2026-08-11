import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import AreaChart from '../components/ui/AreaChart'
import GaugeChart from '../components/ui/GaugeChart'
import ProgressBar from '../components/ui/ProgressBar'
import DayStatusCard from '../components/home/DayStatusCard'
import PendingReview from '../components/home/PendingReview'
import HourlyActivity from '../components/home/HourlyActivity'
import StockAlerts from '../components/home/StockAlerts'
import ReplySplit from '../components/home/ReplySplit'
import { IconChart } from '../components/ui/icons'
import { monthlyActivity } from '../data/mockData'
import { averageResponseMinutes, formatDuration } from '../utils/metrics'
import { groupMessagesByPhone } from '../utils/groupMessages'

export default function Home({
  stats,
  messages,
  products,
  settings,
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  archivedDays,
  onOpenNewDay,
  onNavigate,
}) {
  const { total, automaticos, pendientes } = stats
  const resueltos = total - pendientes
  const conversion = total ? Math.round((resueltos / total) * 100) : 0
  const automatizacion = total ? Math.round((automaticos / total) * 100) : 0
  const conversaciones = groupMessagesByPhone(messages).length
  const responseMinutes = averageResponseMinutes(messages)

  return (
    <div>
      <PageHeader title="Inicio" subtitle="Resumen de actividad de tu WhatsApp" />

      {/* La grilla de KPIs entra escalonada de izquierda a derecha; el mismo
          retraso se le pasa al contador para que el número arranque con la
          tarjeta y no antes. */}
      <div className="stagger mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mensajes hoy"
          value={total}
          hint={`en ${conversaciones} conversación${conversaciones === 1 ? '' : 'es'}`}
          delay={40}
        />
        <StatCard
          label="Pendientes"
          value={pendientes}
          trend={pendientes === 0 ? 'al día' : 'a revisar'}
          tone={pendientes === 0 ? 'good' : 'warning'}
          hint={pendientes === 0 ? 'nada sin responder' : 'esperando respuesta'}
          delay={100}
        />
        <StatCard
          label="Automatización"
          value={`${automatizacion}%`}
          hint={`${automaticos} de ${total} resueltos por el bot`}
          tone="neutral"
          trend={total ? `${automaticos}/${total}` : null}
          delay={160}
        />
        <StatCard
          label="Respuesta promedio"
          value={formatDuration(responseMinutes)}
          hint={responseMinutes === null ? 'sin respuestas medidas' : 'desde que escribe el cliente'}
          tone="neutral"
          delay={220}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="stagger space-y-5 lg:col-span-2" style={{ '--stagger-base': '200ms' }}>
          <PendingReview
            messages={messages}
            onOpenConversation={(phone) => onNavigate('inbox', phone)}
            onNavigate={onNavigate}
          />

          <Card
            title="Actividad de mensajes"
            actions={
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink-muted">
                <IconChart size={13} />
                Últimos 12 meses
              </span>
            }
          >
            <AreaChart
              data={monthlyActivity}
              xKey="month"
              series={[
                { key: 'total', label: 'Mensajes' },
                { key: 'automaticos', label: 'Automáticos', dashed: true },
              ]}
            />
          </Card>

          <HourlyActivity messages={messages} settings={settings} />

          <Card title="Automatización vs. revisión manual (hoy)">
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>Automáticos</span>
                  <span className="tabular-nums">{automaticos} / {total}</span>
                </div>
                <ProgressBar value={automatizacion} delay={120} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>Pendientes de revisión</span>
                  <span className="tabular-nums">{pendientes} / {total}</span>
                </div>
                <ProgressBar
                  value={total ? Math.round((pendientes / total) * 100) : 0}
                  delay={240}
                  className="bg-white/30"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="stagger space-y-5" style={{ '--stagger-base': '240ms' }}>
          <DayStatusCard
            dayStatus={dayStatus}
            dayOpenedAt={dayOpenedAt}
            dayClosedAt={dayClosedAt}
            messageCount={messages.length}
            archivedDays={archivedDays}
            settings={settings}
            onOpenNewDay={onOpenNewDay}
            onNavigate={onNavigate}
          />
          <Card title="Tasa de resolución">
            <GaugeChart
              value={conversion}
              label="Tasa de resolución"
              subtitle={`${resueltos} de ${total} mensajes resueltos hoy`}
            />
          </Card>
          <ReplySplit messages={messages} />
          <StockAlerts products={products} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}
