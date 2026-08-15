import { useEffect, useState } from 'react'
import AnimatedNumber from './AnimatedNumber'

function pointOnArc(cx, cy, r, t) {
  const angle = Math.PI - t * Math.PI // 180° → 0°
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) }
}

function arcPath(cx, cy, r, t0, t1) {
  const start = pointOnArc(cx, cy, r, t0)
  const end = pointOnArc(cx, cy, r, t1)
  // El barrido nunca supera 180°, así que siempre es el arco "chico".
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
}

export default function GaugeChart({ value, label, subtitle }) {
  const cx = 100
  const cy = 90
  const r = 78
  const clamped = Math.max(0, Math.min(100, value))
  const t = clamped / 100

  // El arco se dibuja siempre completo con pathLength="1"; lo que se anima es el
  // dashoffset, así el barrido también transiciona cuando el valor cambia.
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setProgress(t), 120)
    return () => clearTimeout(timer)
  }, [t])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[240px]">
        <svg
          viewBox="0 0 200 104"
          preserveAspectRatio="xMidYMid meet"
          className="w-full overflow-visible"
          role="img"
          aria-label={`${label}: ${clamped}%`}
        >
          {/* Arco fino y en violeta, sin resplandor: antes era una banda negra de
              14px con drop-shadow, y pesaba más que el número que envuelve. */}
          <path
            d={arcPath(cx, cy, r, 0, 1)}
            fill="none"
            stroke="rgb(var(--tint) / 0.1)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d={arcPath(cx, cy, r, 0, 1)}
            pathLength="1"
            fill="none"
            stroke="rgb(var(--violet))"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
            className="transition-[stroke-dashoffset] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </svg>
        <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-[30px] font-semibold tracking-tight text-ink-primary">
          <AnimatedNumber value={`${clamped}%`} duration={1100} delay={120} />
        </p>
      </div>
      {subtitle && (
        <p className="animate-fade-in mt-1 text-center text-xs text-ink-muted" style={{ '--d': '500ms' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
