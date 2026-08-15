import AnimatedNumber from './AnimatedNumber'
import Sparkline from './Sparkline'
import { IconTrendUp, IconTrendDown } from './icons'

// Tarjeta de KPI: rótulo y variación arriba, el número en grande abajo y la
// forma del día a la derecha. La miniatura es lo que ancla la esquina derecha
// (antes lo hacía un ícono, que identificaba la métrica pero no decía nada);
// termina en el mismo valor que el número grande, así la línea cuenta cómo se
// llegó hasta ahí sin pedir una segunda lectura.
//
// La variación sí usa color de estado: no adorna, dice si hoy viene mejor o
// peor que el último día cerrado. `betterWhen` es lo que decide de qué lado
// cae cada métrica — más mensajes es bueno, más pendientes no.
function DeltaChip({ delta, betterWhen }) {
  if (delta === null || delta === undefined) return null

  if (delta === 0) {
    return <span className="shrink-0 text-[13px] text-ink-muted">igual</span>
  }

  const sube = delta > 0
  const bien = sube === (betterWhen === 'up')
  // La flecha apunta a mejor o peor, no a más o menos: en "Pendientes" que
  // bajen es la buena noticia, y una flecha para abajo en verde se lee como un
  // error aunque el color diga lo contrario. Va junto con el color, y el título
  // aclara contra qué se compara.
  const Icon = bien ? IconTrendUp : IconTrendDown

  // La flecha va primero y del tamaño del texto: al final y a 13px quedaba como
  // un adorno colgado del porcentaje en vez de decir hacia dónde va el dato.
  return (
    <span
      className={`flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums ${
        bien ? 'text-status-good' : 'text-status-critical'
      }`}
      title={`${sube ? 'Subió' : 'Bajó'} ${Math.abs(delta)}% contra el último día cerrado`}
    >
      <Icon size={15} />
      {Math.abs(delta)}%
    </span>
  )
}

export default function StatCard({
  label,
  value,
  hint,
  delta = null,
  betterWhen = 'up',
  series,
  delay = 0,
}) {
  return (
    <div className="rounded-xl border border-tint/[0.08] bg-surface-card p-4 shadow-card">
      {/* El rótulo se queda con el ancho entero de la tarjeta y no comparte fila
          con la miniatura: con cuatro tarjetas en una fila, "Respuesta promedio"
          al lado del gráfico se cortaba a la mitad. */}
      <p className="flex items-center gap-2 text-[12px] text-ink-muted">
        <span className="min-w-0 truncate">{label}</span>
        <DeltaChip delta={delta} betterWhen={betterWhen} />
      </p>
      <div className="mt-2.5 flex items-end gap-3">
        <p className="min-w-0 flex-1 text-[30px] font-semibold leading-none tracking-tight text-ink-primary">
          <AnimatedNumber value={value} delay={delay + 180} />
        </p>
        {series && (
          <Sparkline data={series} delay={delay} className="h-11 w-[48%] max-w-[140px] shrink-0" />
        )}
      </div>
      {hint && <p className="mt-2.5 truncate text-[12px] text-ink-muted">{hint}</p>}
    </div>
  )
}
