// Encabezado de página: el título y su línea de contexto a la izquierda, la
// acción de la sección a la derecha, y una línea de 1px que cierra la banda.
//
// Antes era el título solo, centrado, y la acción principal vivía al final de
// la página (`PageActions`, que ya no existe). Centrado, el título no rotula
// nada —queda flotando en el medio de una fila vacía— y deja libre la esquina
// derecha, que es donde se busca el botón en cualquier herramienta de trabajo.
// Alineado a la izquierda arranca en el mismo eje que el contenido de abajo, y
// la acción cae donde ya se la va a buscar sin tener que recorrer la página.
//
// La bajada no repite el nombre de la sección: dice qué hace lo que se ve, y
// es donde cada página metía un párrafo suelto entre el título y las tarjetas.
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="animate-fade-down mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-tint/10 pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-[21px] font-semibold leading-tight tracking-[-0.015em] text-ink-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {/* La acción se alinea con el título y no con la base del bloque: la
          bajada puede tener uno o dos renglones según la página, y atada al
          fondo el botón cambiaba de altura de una sección a otra. Arriba
          siempre cae en el mismo lugar. El `-mt-0.5` la centra ópticamente
          contra la tinta del título, que es más alta que su caja de línea. */}
      {actions && <div className="-mt-0.5 flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
