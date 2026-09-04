import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import { SkeletonCard } from '../components/ui/Skeleton'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
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
import {
  averageResponseMinutes,
  dayStats,
  formatDuration,
  kpiTrends,
  monthlyActivity,
  percentChange,
} from '../utils/metrics'
import { groupMessagesByPhone } from '../utils/groupMessages'
import { formatLongDate, formatTime } from '../utils/time'
import { useIdioma } from '../lib/i18n.jsx'

export default function Home({
  stats,
  messages,
  products,
  settings,
  cargando = false,
  dayStatus,
  dayOpenedAt,
  dayClosedAt,
  archivedDays,
  onOpenNewDay,
  onNavigate,
}) {
  const { t, locale } = useIdioma()
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

  // La bajada del encabezado dice de qué día habla todo lo de abajo. Los KPIs,
  // la actividad por hora y la tasa de resolución son del día abierto, no de
  // "hoy" en el calendario: sin esta línea hay que bajar hasta la tarjeta de
  // estado para enterarse de cuál es.
  const fecha = formatLongDate(new Date(), locale)
  const contexto = dayOpenedAt
    ? dayStatus === 'open'
      ? t('inicio.contextoAbierto', { hora: formatTime(dayOpenedAt) })
      : dayClosedAt
        ? t('inicio.contextoCerrado', { hora: formatTime(dayClosedAt) })
        : t('inicio.contextoCerradoSinHora')
    : t('inicio.contextoSinAbrir')

  // Los rótulos salen del locale activo: "ago" contra "Aug", con la mayúscula
  // que le corresponde a cada idioma. El eje lleva el mes solo, que es lo que
  // entra en 12 columnas de 10px; el mes con año va al tooltip y a la tabla,
  // porque la ventana cruza el fin de año y ahí "Ene" solo no dice cuál.
  const actividadMensual = useMemo(() => {
    const corto = new Intl.DateTimeFormat(locale, { month: 'short' })
    const largo = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)
    return monthlyActivity(messages, archivedDays).map((fila) => ({
      ...fila,
      month: capitalizar(corto.format(fila.date).replace('.', '')),
      periodo: capitalizar(largo.format(fila.date)),
    }))
  }, [messages, archivedDays, locale])

  const hayActividadMensual = actividadMensual.some((fila) => fila.total > 0)

  // Los números de Inicio salen de tres consultas distintas y hasta que
  // contestan valen todos cero. Un tablero de ceros no se lee como "todavía no
  // llegó": se lee como que hoy no pasó nada, que es una afirmación y encima
  // falsa. Así que hasta que hay datos se muestra el hueco con la forma de la
  // página — mismos anchos y misma grilla, para que al llegar no salte nada.
  if (cargando) {
    return (
      <div role="status" aria-label={t('inicio.cargando')}>
        <PageHeader title={t('inicio.titulo')} description={`${fecha} · ${contexto}`} />

        {/* El hueco también lleva el `data-tour`: el recorrido guiado empieza
            justo acá, y arrancando con los datos todavía en viaje el primer
            paso no tendría a quién señalar y se saltearía solo. */}
        <div data-tour="home-kpis" className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} lineas={1} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <SkeletonCard lineas={4} />
            <SkeletonCard lineas={6} />
          </div>
          <div className="space-y-4">
            <SkeletonCard lineas={5} />
            <SkeletonCard lineas={3} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('inicio.titulo')} description={`${fecha} · ${contexto}`} />

      {/* La grilla de KPIs entra escalonada de izquierda a derecha; el mismo
          retraso se le pasa al contador para que el número arranque con la
          tarjeta y no antes. */}
      <div
        data-tour="home-kpis"
        className="stagger mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t('inicio.kpiMensajes')}
          value={total}
          hint={t('inicio.kpiMensajesHint', { n: conversaciones })}
          delta={statsAyer ? percentChange(total, statsAyer.total) : null}
          series={trends.mensajes}
          delay={40}
        />
        <StatCard
          label={t('inicio.kpiPendientes')}
          value={pendientes}
          hint={pendientes === 0 ? t('inicio.kpiPendientesCero') : t('inicio.kpiPendientesHint')}
          delta={statsAyer ? percentChange(pendientes, statsAyer.pendientes) : null}
          betterWhen="down"
          series={trends.pendientes}
          delay={100}
        />
        <StatCard
          label={t('inicio.kpiAutomatizacion')}
          value={`${automatizacion}%`}
          hint={t('inicio.kpiAutomatizacionHint', { automaticos, total })}
          delta={percentChange(automatizacion, automatizacionAyer)}
          series={trends.automatizacion}
          delay={160}
        />
        <StatCard
          label={t('inicio.kpiRespuesta')}
          value={formatDuration(responseMinutes)}
          hint={
            responseMinutes === null
              ? t('inicio.kpiRespuestaSinDatos')
              : t('inicio.kpiRespuestaHint')
          }
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

          {/* El rótulo de la ventana solo se dibuja si hay gráfico: rotulando
              el estado vacío diría de qué doce meses es la línea que no está. */}
          <Card
            title={t('inicio.actividadMensajes')}
            actions={
              hayActividadMensual && (
                <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <IconChart size={13} />
                  {t('inicio.ultimos12Meses')}
                </span>
              )
            }
          >
            {hayActividadMensual ? (
              <AreaChart
                data={actividadMensual}
                xKey="month"
                xLongKey="periodo"
                xLabel={t('inicio.columnaMes')}
                ariaLabel={t('inicio.actividadMensajesAria')}
                series={[
                  { key: 'total', label: t('inicio.serieMensajes') },
                  { key: 'automaticos', label: t('inicio.serieAutomaticos'), dashed: true },
                ]}
              />
            ) : (
              <EmptyState
                icon={<IconChart size={18} />}
                title={t('inicio.sinActividadMensual')}
                description={t('inicio.sinActividadMensualDetalle')}
              />
            )}
          </Card>

          <HourlyActivity messages={messages} settings={settings} />

          <Card title={t('inicio.automatizacionVsManual')}>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>{t('inicio.automaticos')}</span>
                  <span className="tabular-nums">{automaticos} / {total}</span>
                </div>
                <ProgressBar value={automatizacion} delay={120} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>{t('inicio.pendientesDeRevision')}</span>
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
          <Card title={t('inicio.tasaResolucion')}>
            <GaugeChart
              value={conversion}
              label={t('inicio.tasaResolucion')}
              subtitle={t('inicio.tasaResolucionSub', { resueltos, total })}
            />
          </Card>
          <ReplySplit messages={messages} />
          <StockAlerts products={products} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  )
}
