import SideNav from './SideNav'
import Topbar from './Topbar'

// La bandeja arma su propia barra (la de navegación con sus carpetas colgando)
// y sus columnas, así que ocupa la pantalla entera sin barra superior ni
// padding. El resto de las páginas usan la barra pelada y el margen de siempre.
export default function Layout({
  current,
  onNavigate,
  username,
  onLogout,
  pendingCount = 0,
  children,
}) {
  const ownsChrome = current === 'inbox'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {!ownsChrome && (
        <SideNav
          current={current}
          onNavigate={onNavigate}
          username={username}
          onLogout={onLogout}
          pendingCount={pendingCount}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {ownsChrome ? (
          // La `key` remonta el contenido al cambiar de página, y con eso vuelven
          // a dispararse las animaciones de entrada de cada sección.
          <main key={current} className="animate-fade-in flex min-h-0 flex-1">
            {children}
          </main>
        ) : (
          <>
            <div className="px-6 pt-5">
              <Topbar username={username} />
            </div>
            <main className="flex-1 overflow-y-auto px-6 py-5">
              <div key={current} className="animate-fade-in">
                {children}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  )
}
