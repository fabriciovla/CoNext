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
import {
  averageResponseMinutes,
  dayStats,
  formatDuration,
  kpiTrends,
  percentChange,
} from '../utils/metrics'
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

  // La línea de cada tarjeta es la hora a hora del día abierto, y la variación
  // se mide contra el último día cerrado (`archivedDays` viene del más reciente
  // al más viejo). Si todavía no cerró ninguno, no hay variación que mostrar.
  const trends = kpiTrends(messages, settings)
  const anterior = archivedDays[0] ?? null
  const statsAyer = anterior ? dayStats(anterior.messages) : null
  const respuestaAyer = anterior ? averageResponseMinutes(anterior.messages) : null
  const automatizacionAyer =
    statsAyer && statsAyer.total
      ? Math.round((statsAyer.automaticos / statsAyer.total) * 100)
      : null

  return (
    <div>
      <PageHeader title="Inicio" />

      {/* La grilla de KPIs entra escalonada de izquierda a derecha; el mismo
          retraso se le pasa al contador para que el número arranque con la
          tarjeta y no antes. */}
      <div className="stagger mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mensajes hoy"
          value={total}
          hint={`en ${conversaciones} conversación${conversaciones === 1 ? '' : 'es'}`}
          delta={statsAyer ? percentChange(total, statsAyer.total) : null}
          series={trends.mensajes}
          delay={40}
        />
        <StatCard
          label="Pendientes"
          value={pendientes}
          hint={pendientes === 0 ? 'nada sin responder' : 'esperando respuesta'}
          delta={statsAyer ? percentChange(pendientes, statsAyer.pendientes) : null}
          betterWhen="down"
          series={trends.pendientes}
          delay={100}
        />
        <StatCard
          label="Automatización"
          value={`${automatizacion}%`}
          hint={`${automaticos} de ${total} resueltos por el bot`}
          delta={percentChange(automatizacion, automatizacionAyer)}
          series={trends.automatizacion}
          delay={160}
        />
        <StatCard
          label="Respuesta promedio"
          value={formatDuration(responseMinutes)}
          hint={responseMinutes === null ? 'sin respuestas medidas' : 'desde que escribe el cliente'}
          delta={percentChange(responseMinutes, respuestaAyer)}
          betterWhen="down"
          series={trends.respuesta}
          delay={220}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="stagger space-y-4 lg:col-span-2" style={{ '--stagger-base': '200ms' }}>
          <PendingReview
            messages={messages}
            onOpenConversation={(phone) => onNavigate('inbox', phone)}
            onNavigate={onNavigate}
          />

          <Card
            title="Actividad de mensajes"
            actions={
              <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
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
                  className="bg-tint/30"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="stagger space-y-4" style={{ '--stagger-base': '240ms' }}>
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
