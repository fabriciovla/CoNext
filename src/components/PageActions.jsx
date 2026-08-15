// La acción principal de una sección va al final de la página, centrada y debajo
// de lo que la sección lista: primero se lee lo que hay, y recién después la
// opción de agregar uno más. Antes vivía arriba, en `PageHeader`, que ahora es
// solo el título.
export default function PageActions({ children }) {
  return (
    <div
      className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-2"
      style={{ '--d': '140ms' }}
    >
      {children}
    </div>
  )
}
