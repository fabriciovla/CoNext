import AnimatedNumber from './AnimatedNumber'

const TRENDS = {
  good: 'bg-status-good/10 text-status-good',
  warning: 'bg-status-warning/10 text-status-warning',
  critical: 'bg-status-critical/10 text-status-critical',
  neutral: 'bg-white/10 text-ink-secondary',
}

export default function StatCard({ label, value, hint, trend, tone = 'good', delay = 0 }) {
  return (
    <div
      className="card-interactive group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-card p-5 shadow-card
        hover:-translate-y-0.5 hover:border-white/[0.14]
        hover:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_22px_45px_-22px_rgba(0,0,0,0.95)]"
    >
      {/* Barrido diagonal tenue del acento de marca, solo al pasar el mouse. */}
      <span className="pointer-events-none absolute inset-0 bg-accent-gradient opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]" />

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-2.5 text-3xl font-semibold leading-none text-ink-primary">
          <AnimatedNumber value={value} delay={delay + 180} />
        </p>
        {(hint || trend) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium transition-transform duration-300 group-hover:scale-105 ${TRENDS[tone]}`}
              >
                {trend}
              </span>
            )}
            {hint && <span className="text-ink-muted">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
