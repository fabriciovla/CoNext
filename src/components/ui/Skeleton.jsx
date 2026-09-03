// El hueco que ocupa algo que todavía no llegó.
//
// Existe porque casi todo lo que se ve entra después del primer cuadro: las
// tarjetas de Inicio, el catálogo, los agentes y sobre todo las plantillas, que
// se leen en vivo de Graph. Sin esto, la página se dibuja vacía —o peor, con el
// estado de "no hay nada"— y un instante después aparece todo de golpe, que se
// lee como que la app estaba rota y se arregló sola.
//
// Es la única excepción a "sin movimiento decorativo": el barrido no adorna,
// dice que hay algo en camino. Un bloque gris quieto es indistinguible de un
// bloque gris que se colgó.
//
// Es la misma animación del aviso de "Enviando…" (`animate-barrido`), lineal y
// no `ease`: a velocidad constante se lee como algo trabajando, mientras que si
// acelera y frena se lee como un objeto yendo y viniendo.
export function SkeletonLinea({ className = 'h-3 w-full' }) {
  return (
    <span className={`relative block overflow-hidden rounded-md bg-tint/[0.07] ${className}`}>
      <span
        className="animate-barrido absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-tint/[0.09] to-transparent"
        aria-hidden="true"
      />
    </span>
  )
}

// Los anchos no son todos iguales a propósito: un bloque de barras del mismo
// largo se lee como una tabla vacía y no como un texto que está por llegar.
const ANCHOS = ['w-full', 'w-full', 'w-[68%]', 'w-full', 'w-[82%]', 'w-[55%]']

// Una tarjeta entera esperando. `lineas` es cuánto texto va a tener adentro,
// para que el hueco mida más o menos lo que va a venir y la página no salte
// cuando llegue.
export function SkeletonCard({ lineas = 4, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-tint/[0.07] bg-surface-card p-5 shadow-card ${className}`}
      aria-hidden="true"
    >
      {/* El título: más corto y un poco más alto que el cuerpo. */}
      <SkeletonLinea className="h-3.5 w-[42%]" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lineas }, (_, i) => (
          <SkeletonLinea key={i} className={`h-2.5 ${ANCHOS[i % ANCHOS.length]}`} />
        ))}
      </div>
    </div>
  )
}

// Varias tarjetas iguales. El `role="status"` es lo que hace que un lector de
// pantalla anuncie que se está cargando algo en vez de leer un bloque de nada.
export default function Skeleton({ cards = 3, lineas = 4, className = '' }) {
  return (
    <div role="status" aria-label="Cargando" className={className}>
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i} lineas={lineas} />
      ))}
    </div>
  )
}
