import { useId } from 'react'
import { smoothPath } from '../../utils/curve'

// Miniatura de una serie: línea violeta y el degradé que cae hasta la base. Sin
// ejes, sin grilla y sin tooltip a propósito — no se lee un valor acá, se lee
// una forma; el número exacto ya está al lado, en grande.
const W = 240
const H = 64
// Margen vertical: sin él, el pico y el valle quedan cortados por el borde del
// viewBox (el trazo tiene grosor y se dibuja centrado sobre la curva).
const PAD_Y = 5

export default function Sparkline({ data = [], className = '', delay = 0 }) {
  const gradientId = useId()
  const points = data.filter((v) => Number.isFinite(v))

  // La escala es de mínimo a máximo de la propia serie, no desde cero: la
  // tarjeta muestra la variación del día, y contra un eje fijo en 0 una serie
  // que se mueve poco se aplana hasta parecer una raya.
  const max = Math.max(...points)
  const min = Math.min(...points)
  const flat = points.length < 2 || max === min

  if (flat) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={className}
        aria-hidden="true"
      >
        <line
          x1="0"
          x2={W}
          y1={H / 2}
          y2={H / 2}
          stroke="rgb(var(--tint) / 0.18)"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  const step = W / (points.length - 1)
  const coords = points.map((v, i) => ({
    x: i * step,
    y: PAD_Y + (1 - (v - min) / (max - min)) * (H - PAD_Y * 2),
  }))

  const line = smoothPath(coords)
  const area = `${line} L ${W} ${H} L 0 ${H} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--violet))" stopOpacity="0.32" />
          <stop offset="100%" stopColor="rgb(var(--violet))" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={area}
        fill={`url(#${gradientId})`}
        className="animate-fade-in"
        style={{ '--d': `${delay + 320}ms` }}
      />
      {/* El SVG se estira horizontalmente (preserveAspectRatio="none"), así que
          sin `non-scaling-stroke` el grosor de la línea cambiaría con el ancho
          de la tarjeta y las cuatro de la fila se verían distintas. */}
      <path
        d={line}
        pathLength="1"
        fill="none"
        stroke="rgb(var(--violet))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="animate-draw"
        style={{ '--d': `${delay + 120}ms` }}
      />
    </svg>
  )
}
