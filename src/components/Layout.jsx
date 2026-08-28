// La barra de la izquierda es una sola y vive acá: se arma en App (`nav`) y no
// cambia de forma al navegar. Lo que sí cambia es el marco de la derecha — la
// bandeja arma sus propias columnas y ocupa la pantalla entera, sin padding; el
// resto de las páginas usan el margen de siempre. Ya no hay barra superior: el
// buscador global no filtraba nada fuera de la bandeja (que tiene el suyo) y el
// usuario ya está al pie de la barra izquierda.
export default function Layout({ current, nav, children }) {
  const ownsChrome = current === 'inbox'
  // Productos llena la altura: el listado scrollea adentro de la tarjeta.
  // Si `main` scrolleara, con muchos ítems se iban el título, las carpetas y
  // el pie, y había que volver arriba para buscar o cambiar de carpeta.
  const fillsViewport = current === 'products'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {nav}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {ownsChrome ? (
          // La `key` remonta el contenido al cambiar de página, y con eso vuelven
          // a dispararse las animaciones de entrada de cada sección.
          <main key={current} className="animate-fade-in flex min-h-0 flex-1">
            {children}
          </main>
        ) : (
          // El contenido va en una columna centrada y con techo de ancho: sin
          // el techo, en un monitor ancho la página se estira de borde a borde
          // y las tarjetas quedan pegadas a la izquierda. El `w-full` es lo
          // que hace que el `mx-auto` centre en pantallas chicas también.
          <main
            className={`flex-1 px-6 py-6 sm:px-8 ${
              fillsViewport ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto'
            }`}
          >
            <div
              key={current}
              className={`animate-fade-in mx-auto w-full max-w-[1280px] ${
                fillsViewport ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''
              }`}
            >
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
