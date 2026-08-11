import Card from '../ui/Card'
import AnimatedNumber from '../ui/AnimatedNumber'
import ProgressBar from '../ui/ProgressBar'
import { IconBolt, IconUser } from '../ui/icons'
import { repliesByAuthor } from '../../utils/metrics'

// Cuánto del trabajo de responder se llevó el bot y cuánto lo escribiste vos:
// mira los salientes por autor, que es distinto de los entrantes automáticos.
export default function ReplySplit({ messages }) {
  const { total, bot, admin } = repliesByAuthor(messages)
  const botShare = total ? Math.round((bot / total) * 100) : 0

  return (
    <Card title="Respuestas enviadas">
      {total === 0 ? (
        <p className="text-sm text-ink-muted">Todavía no salió ninguna respuesta en este día.</p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold leading-none text-ink-primary">
              <AnimatedNumber value={total} delay={150} />
            </p>
            <p className="text-xs text-ink-muted">
              <AnimatedNumber value={`${botShare}%`} delay={150} /> las mandó el bot
            </p>
          </div>

          <div className="mt-3">
            <ProgressBar value={botShare} delay={200} />
          </div>

          <div className="animate-fade-in mt-3 flex items-center justify-between text-xs" style={{ '--d': '350ms' }}>
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <IconBolt size={13} />
              Bot
              <span className="tabular-nums text-ink-primary">{bot}</span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-secondary">
              <IconUser size={13} />
              Manuales
              <span className="tabular-nums text-ink-primary">{admin}</span>
            </span>
          </div>
        </>
      )}
    </Card>
  )
}
