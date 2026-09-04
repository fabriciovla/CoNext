// Miniatura de una serie: franja de barras que crecen desde la base, la misma
// convención que "Mensajes por hora" (`HourlyActivity`) y no una curva SVG.
// Sin ejes, sin grilla y sin tooltip a propósito — acá no se lee un valor, se
// lee una forma; el número exacto ya está al lado, en grande. La última barra
// es la del momento actual y va en violeta pleno; el resto, en el mismo
// violeta apagado, así el ojo la encuentra sin que las demás compitan por
// atención (mismo criterio que la barra pico de `HourlyActivity`).
//
// La escala es de mínimo a máximo de la propia serie, no desde cero: la
// tarjeta muestra la variación del día, y contra un piso fijo en 0 una serie
// que se mueve poco se aplana hasta desaparecer. `FLOOR` le deja un alto
// mínimo visible al valor más bajo, para que siga leyéndose como una barra y
// no como una raya.
const FLOOR = 0.12

export default function Sparkline({ data = [], className = '', delay = 0 }) {
  const points = data.filter((v) => Number.isFinite(v))
  if (points.length === 0) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min

  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
      {points.map((v, i) => {
        const pct = range === 0 ? 55 : Math.round((FLOOR + (1 - FLOOR) * ((v - min) / range)) * 100)
        const actual = i === points.length - 1
        return (
          <div key={i} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className={`animate-grow-up w-full rounded-full ${actual ? 'bg-violet' : 'bg-violet/25'}`}
              style={{ height: `${pct}%`, '--d': `${delay + 320 + i * 24}ms` }}
            />
          </div>
        )
      })}
    </div>
  )
}
