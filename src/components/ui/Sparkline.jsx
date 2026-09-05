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

// Cuántas barras entran antes de que dejen de ser barras.
//
// La miniatura mide 140px de ancho como mucho, así que con veinticuatro horas
// —un negocio abierto todo el día— cada barra queda en tres píxeles con tres de
// separación: eso ya no es una forma, es una trama. La serie se muestrea a este
// tope quedándose con puntos repartidos parejo.
//
// El último punto se conserva siempre y no por prolijidad: es "ahora", es la
// barra que va en violeta pleno y es exactamente el número que la tarjeta
// muestra al lado en grande. Perderlo haría que la miniatura termine en un
// valor que no es el que está escrito.
const MAX_BARRAS = 14

function muestrear(valores) {
  if (valores.length <= MAX_BARRAS) return valores
  const paso = (valores.length - 1) / (MAX_BARRAS - 1)
  return Array.from({ length: MAX_BARRAS }, (_, i) => valores[Math.round(i * paso)])
}

export default function Sparkline({ data = [], className = '', delay = 0 }) {
  const points = muestrear(data.filter((v) => Number.isFinite(v)))
  if (points.length === 0) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min

  return (
    <div className={`flex items-end gap-[2px] ${className}`} aria-hidden="true">
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
