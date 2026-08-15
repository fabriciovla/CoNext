// Solo el título, centrado. Las acciones de la sección ya no van acá: están al
// final de la página, en `PageActions`, debajo de lo que la sección lista.
//
// No hay bajada: el título más la barra de la izquierda ya dicen dónde estás, y
// la línea de abajo cierra el encabezado sin necesidad de una frase que repita
// el nombre de la sección.
export default function PageHeader({ title }) {
  return (
    // La línea cierra el encabezado y arranca donde arrancan las tarjetas de
    // abajo, no contra el borde de la ventana: sangrar el borde con un `-mx-6`
    // ataría este componente al padding que hoy pone `Layout`.
    <div className="mb-5 border-b border-tint/10 pb-2 text-center">
      <h1 className="animate-fade-down text-[19px] font-semibold tracking-tight text-ink-primary">
        {title}
      </h1>
    </div>
  )
}
