import Card from '../ui/Card'
import { messagesByHour } from '../../utils/metrics'
import { useT } from '../../lib/i18n.jsx'

// La hora pico va en violeta pleno y el resto en el mismo violeta apagado: así
// la forma del día se lee de un vistazo sin que cada barra pida atención por
// separado, y el pico no necesita otro color para destacarse.
function barColor(total, peak) {
  if (total === 0) return 'bg-tint/[0.05]'
  return total === peak ? 'bg-violet' : 'bg-violet/30'
}

// Barras en HTML (no SVG): el alto sale de un porcentaje, así el texto de las
// horas nunca se deforma cuando el panel cambia de ancho.
export default function HourlyActivity({ messages, settings }) {
  const t = useT()
  const bars = messagesByHour(messages, settings)
  const peak = Math.max(...bars.map((b) => b.total), 0)
  const hasActivity = peak > 0

  return (
    <Card
      title={t('inicio.mensajesPorHora')}
      actions={
        hasActivity && (
          <span className="animate-fade-in text-xs text-ink-muted" style={{ '--d': '600ms' }}>
            {t('inicio.pico', { hora: bars.find((b) => b.total === peak).hour, n: peak })}
          </span>
        )
      }
    >
      {!hasActivity ? (
        <p className="text-sm text-ink-muted">{t('inicio.sinMensajesHoy')}</p>
      ) : (
        <div className="flex h-36 items-stretch gap-1.5">
          {bars.map(({ hour, total }, i) => (
            <div key={hour} className="group/bar flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full flex-1 items-end"
                title={t('inicio.horaTooltip', { hora: hour, n: total })}
              >
                {/* Cada barra sube desde la base, una detrás de otra de izquierda
                    a derecha, como si el día se fuera llenando. */}
                <div
                  className={`animate-grow-up w-full rounded-sm transition-colors duration-200 group-hover/bar:brightness-110 ${barColor(total, peak)}`}
                  style={{
                    height: total === 0 ? '2px' : `${(total / peak) * 100}%`,
                    '--d': `${150 + i * 28}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-ink-muted transition-colors duration-200 group-hover/bar:text-ink-primary">
                {hour}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
