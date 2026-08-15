import { useId, useRef, useState } from 'react'
import { smoothPath } from '../../utils/curve'

// El SVG se estira horizontalmente (preserveAspectRatio="none") para llenar el
// ancho disponible, así que las etiquetas de los ejes van en HTML alrededor del
// gráfico: dentro del SVG el texto se deformaría con la escala.
const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 10, right: 8, bottom: 8, left: 8 }
const CHART_W = WIDTH - PAD.left - PAD.right
const CHART_H = HEIGHT - PAD.top - PAD.bottom

export default function AreaChart({ data, xKey, series }) {
  const gradientId = useId()
  const containerRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [showTable, setShowTable] = useState(false)

  const maxRaw = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key])))
  const maxY = Math.max(10, Math.ceil(maxRaw / 10) * 10)
  const xStep = data.length > 1 ? CHART_W / (data.length - 1) : 0

  const x = (i) => PAD.left + i * xStep
  const y = (v) => PAD.top + (1 - v / maxY) * CHART_H
  const baseline = PAD.top + CHART_H

  const seriesPoints = series.map((s) => data.map((d, i) => ({ x: x(i), y: y(d[s.key]) })))
  const yTicks = [0, maxY / 2, maxY]

  const handleMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    const rawX = fraction * WIDTH
    const idx = Math.round((rawX - PAD.left) / xStep)
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)))
  }

  if (showTable) {
    return (
      <div className="animate-fade-in">
        <ToggleButton showTable={showTable} onClick={() => setShowTable(false)} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-tint/[0.08] text-[12px] text-ink-faint">
                <th className="px-3 pb-2 font-normal">Mes</th>
                {series.map((s) => (
                  <th key={s.key} className="px-3 pb-2 font-normal">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tint/[0.05]">
              {data.map((d) => (
                <tr key={d[xKey]}>
                  <td className="px-3 py-2 text-ink-secondary">{d[xKey]}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-2 tabular-nums text-ink-secondary">{d[s.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {series.map((s, i) => (
            <div
              key={s.key}
              className="animate-fade-right flex items-center gap-1.5 text-xs text-ink-muted"
              style={{ '--d': `${i * 80}ms` }}
            >
              {s.dashed ? (
                <svg width="14" height="2" className="shrink-0">
                  <line x1="0" y1="1" x2="14" y2="1" stroke="rgb(var(--ink-faint))" strokeWidth="2" strokeDasharray="3 3" />
                </svg>
              ) : (
                <span className="h-2 w-2 shrink-0 rounded-full bg-violet" />
              )}
              {s.label}
            </div>
          ))}
        </div>
        <ToggleButton showTable={showTable} onClick={() => setShowTable(true)} />
      </div>

      <div className="flex gap-2">
        <div className="relative h-[220px] w-6 shrink-0">
          {yTicks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-ink-muted"
              style={{ top: `${(y(t) / HEIGHT) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div ref={containerRef} className="relative" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-[220px] w-full" role="img" aria-label="Actividad de mensajes por mes">
              <defs>
                {/* La serie principal es la única con color: el violeta de marca.
                    La secundaria queda en gris punteado, que es justamente lo
                    que se espera de una referencia. */}
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(var(--violet))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(var(--violet))" stopOpacity="0" />
                </linearGradient>
              </defs>

              {yTicks.map((t, i) => (
                <line
                  key={t}
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="rgb(var(--tint) / 0.09)"
                  strokeWidth="1"
                  className="animate-fade-in"
                  style={{ '--d': `${i * 70}ms` }}
                />
              ))}

              {seriesPoints.map((points, sIdx) => {
                const s = series[sIdx]
                const linePath = smoothPath(points)
                if (s.dashed) {
                  // Esta serie ya usa strokeDasharray para el punteado, así que no
                  // puede dibujarse con el truco del dashoffset: entra fundiéndose.
                  return (
                    <path
                      key={s.key}
                      d={linePath}
                      fill="none"
                      stroke="rgb(var(--ink-faint))"
                      strokeWidth="1.75"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      className="animate-fade-in"
                      style={{ '--d': '750ms' }}
                    />
                  )
                }
                const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
                return (
                  <g key={s.key}>
                    <path
                      d={areaPath}
                      fill={`url(#${gradientId})`}
                      className="animate-fade-in"
                      style={{ '--d': '600ms' }}
                    />
                    <path
                      d={linePath}
                      pathLength="1"
                      fill="none"
                      stroke="rgb(var(--violet))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-draw"
                    />
                  </g>
                )
              })}

              {hoverIndex !== null && (
                <line
                  x1={x(hoverIndex)}
                  x2={x(hoverIndex)}
                  y1={PAD.top}
                  y2={baseline}
                  stroke="rgb(var(--tint) / 0.28)"
                  strokeWidth="1"
                  style={{ transition: 'x1 160ms ease-out, x2 160ms ease-out' }}
                />
              )}
            </svg>

            {/* Los puntos van en HTML y no adentro del SVG: con
                preserveAspectRatio="none" un <circle> se estira junto con el
                eje X y queda ovalado. Acá el alto del SVG es exactamente
                HEIGHT, así que x/y se traducen a porcentajes del contenedor. */}
            {hoverIndex !== null &&
              series.map((s, sIdx) => (
                <span
                  key={s.key}
                  className="pointer-events-none absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface-card transition-[left,top] duration-[160ms] ease-out"
                  style={{
                    left: `${(seriesPoints[sIdx][hoverIndex].x / WIDTH) * 100}%`,
                    top: `${(seriesPoints[sIdx][hoverIndex].y / HEIGHT) * 100}%`,
                    borderColor: s.dashed ? 'rgb(var(--ink-faint))' : 'rgb(var(--violet))',
                  }}
                />
              ))}

            {hoverIndex !== null && (
              <div
                className="animate-fade-in pointer-events-none absolute top-2 -translate-x-1/2 rounded-lg border border-tint/10 bg-surface-raised px-3 py-2 text-xs shadow-pop transition-[left] duration-200 ease-out"
                style={{ left: `${Math.min(90, Math.max(10, (x(hoverIndex) / WIDTH) * 100))}%` }}
              >
                <p className="mb-1 font-medium text-ink-primary">{data[hoverIndex][xKey]}</p>
                {series.map((s) => (
                  <p key={s.key} className="flex items-center gap-1.5 text-ink-secondary">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: s.dashed ? 'rgb(var(--ink-faint))' : 'rgb(var(--violet))' }}
                    />
                    {s.label}: <span className="font-medium text-ink-primary">{data[hoverIndex][s.key]}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
            {data.map((d, i) => (
              <span
                key={d[xKey]}
                className={`transition-colors duration-200 ${hoverIndex === i ? 'text-ink-primary' : ''}`}
              >
                {d[xKey]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleButton({ showTable, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md px-2 py-1 text-[12px] text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
    >
      {showTable ? 'Ver gráfico' : 'Ver tabla'}
    </button>
  )
}
