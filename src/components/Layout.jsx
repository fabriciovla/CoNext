import { IconSidebarToggle } from './ui/icons'

// La barra de la izquierda es una sola y vive acá: se arma en App (`nav`) y no
// cambia de forma al navegar. Lo que sí cambia es el marco de la derecha — la
// bandeja arma sus propias columnas y ocupa la pantalla entera, sin padding; el
// resto de las páginas usan el margen de siempre. Ya no hay barra superior: el
// buscador global no filtraba nada fuera de la bandeja (que tiene el suyo) y el
// usuario ya está al pie de la barra izquierda.
export default function Layout({ current, nav, navOpen = true, onExpandNav, children }) {
  const ownsChrome = current === 'inbox'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {/* La barra se colapsa animando el ancho del contenedor: desmontarla
          cortaría la transición en seco. Animar el ancho relayoutea la página
          entera en cada cuadro, así que la transición es corta a propósito. */}
      <div
        className={`shrink-0 overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          navOpen ? 'w-[248px]' : 'w-0'
        }`}
      >
        {nav}
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {ownsChrome ? (
          // La `key` remonta el contenido al cambiar de página, y con eso vuelven
          // a dispararse las animaciones de entrada de cada sección.
          <main key={current} className="animate-fade-in flex min-h-0 flex-1">
            {children}
          </main>
        ) : (
          <>
            {/* Con la barra plegada hace falta una forma de traerla de vuelta.
                En la bandeja ese botón lo pone la lista de conversaciones. */}
            {!navOpen && (
              <div className="px-6 pt-5">
                <button
                  onClick={onExpandNav}
                  title="Mostrar barra"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
                >
                  <IconSidebarToggle size={15} />
                </button>
              </div>
            )}
            {/* El contenido va en una columna centrada y con techo de ancho: sin
                el techo, en un monitor ancho la página se estira de borde a borde
                y las tarjetas quedan pegadas a la izquierda. El `w-full` es lo
                que hace que el `mx-auto` centre en pantallas chicas también. */}
            <main className="flex-1 overflow-y-auto px-6 py-5">
              <div key={current} className="animate-fade-in mx-auto w-full max-w-[1100px]">
                {children}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  )
}
