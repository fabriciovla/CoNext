import Card from '../ui/Card'
import { messagesByHour } from '../../utils/metrics'

function barColor(total, peak) {
  if (total === 0) return 'bg-white/[0.06]'
  return total === peak ? 'bg-white' : 'bg-white/25'
}

// Barras en HTML (no SVG): el alto sale de un porcentaje, así el texto de las
// horas nunca se deforma cuando el panel cambia de ancho.
export default function HourlyActivity({ messages, settings }) {
  const bars = messagesByHour(messages, settings)
  const peak = Math.max(...bars.map((b) => b.total), 0)
  const hasActivity = peak > 0

  return (
    <Card
      title="Mensajes por hora (hoy)"
      actions={
        hasActivity && (
          <span className="animate-fade-in text-xs text-ink-muted" style={{ '--d': '600ms' }}>
            Pico: {bars.find((b) => b.total === peak).hour}:00 h · {peak} mensajes
          </span>
        )
      }
    >
      {!hasActivity ? (
        <p className="text-sm text-ink-muted">Todavía no entraron mensajes en este día.</p>
      ) : (
        <div className="flex h-36 items-stretch gap-1.5">
          {bars.map(({ hour, total }, i) => (
            <div key={hour} className="group/bar flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full flex-1 items-end"
                title={`${hour}:00 h — ${total} mensaje${total === 1 ? '' : 's'}`}
              >
                {/* Cada barra sube desde la base, una detrás de otra de izquierda
                    a derecha, como si el día se fuera llenando. */}
                <div
                  className={`animate-grow-up w-full rounded-t-md transition-colors duration-200 group-hover/bar:brightness-125 ${barColor(total, peak)}`}
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
