import { useT } from '../lib/i18n.jsx'
import Avatar from './ui/Avatar'
import Logo, { NOMBRE_MARCA } from './ui/Logo'
import {
  IconHome,
  IconInbox,
  IconBox,
  IconSettings,
  IconLogOut,
  IconChevronDown,
  IconSparkles,
  IconTemplate,
  IconSun,
  IconMoon,
} from './ui/icons'

// El rótulo sale del diccionario por la misma clave que la página, así que
// agregar una sección es una entrada acá y otra en `textos/comun.js`.
const NAV_ITEMS = [
  { key: 'home', Icon: IconHome },
  { key: 'inbox', Icon: IconInbox },
  { key: 'agents', Icon: IconSparkles },
  { key: 'products', Icon: IconBox },
  { key: 'templates', Icon: IconTemplate },
  { key: 'settings', Icon: IconSettings },
]

// Fila de la barra: ícono (o emoji), nombre y cantidad a la derecha. Es el
// ladrillo de toda la columna — secciones de la app y carpetas de la bandeja
// usan la misma fila, así que la selección y el hover se definen una sola vez.
// El `dataTour` es a quién señala el recorrido guiado (`Tour.jsx`) cuando el
// paso pide tocar una fila puntual y no la lista entera. Va como atributo y no
// como una ref que suba hasta App: así el tour sabe de la barra sin que la barra
// sepa nada del tour.
export function NavRow({ icon, emoji, label, count, active, onClick, dataTour }) {
  return (
    <button
      data-tour={dataTour}
      onClick={onClick}
      // El ítem activo se dice solo con el fondo y el peso del texto. Antes
      // llevaba además una barrita violeta pegada al borde izquierdo: era una
      // segunda marca para lo mismo, y con una por cada sección, carpeta y
      // agente, la columna quedaba con una fila de rayitas al costado.
      className={`group flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left text-[13.5px]
        transition-colors duration-150
        ${active ? 'bg-tint/[0.09] font-medium text-ink-primary' : 'text-ink-muted hover:bg-tint/[0.05] hover:text-ink-primary'}`}
    >
      {emoji ? (
        <span className="w-[16px] shrink-0 text-center text-[13.5px] leading-none">{emoji}</span>
      ) : (
        <span className={`shrink-0 ${active ? 'text-ink-primary' : 'text-ink-muted group-hover:text-ink-primary'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span
          className={`shrink-0 text-[11.5px] tabular-nums ${active ? 'text-ink-primary' : 'text-ink-faint group-hover:text-ink-muted'}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// Título de sección plegable. Se pliega de verdad (no es decorativo): con todas
// las secciones abiertas la columna no entra en una pantalla de portátil.
export function NavSection({ title, open, onToggle, children }) {
  return (
    <div className="mt-3">
      <button onClick={onToggle} className="group flex w-full items-center justify-between gap-2 px-2.5 py-1 text-left">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-faint transition-colors group-hover:text-ink-muted">
          {title}
        </span>
        <IconChevronDown
          size={13}
          className={`shrink-0 text-ink-faint transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-ink-muted ${
            open ? '' : '-rotate-90'
          }`}
        />
      </button>
      {/* Se anima el alto: el contenido queda montado y el plegado no corta la
          transición como haría desmontarlo. */}
      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-px pt-0.5">{children}</div>
        </div>
      </div>
    </div>
  )
}

// Única barra de navegación de la app. Arriba las secciones (Inicio, Bandeja,
// Productos, Configuración) y debajo lo que cada página quiera colgar: la
// bandeja mete acá sus carpetas, sus agentes y su ciclo de vida.
export default function SideNav({
  current,
  onNavigate,
  username,
  storeName,
  onLogout,
  pendingCount = 0,
  theme,
  onToggleTheme,
  children,
  footer,
  // "Bandeja" hace de carpeta "Todas": se marca activo con esto y no con
  // `current === key`, porque `current` sigue siendo 'inbox' aunque esté
  // elegida otra carpeta (Mías, Sin asignar…) y ahí no tiene que remarcarse.
  inboxActive = false,
}) {
  const t = useT()

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-tint/[0.07] bg-surface-nav">
      {/* El logotipo y, debajo, de qué negocio es esta bandeja.

          El bloque va **centrado** en la columna. Estuvo alineado a la
          izquierda a 18px —los mismos que las filas de abajo, que es `px-2` del
          contenedor más `px-2.5` de `NavRow`— con el argumento de que centrado
          no se alinea con nada. Son dos renglones de distinto largo y funciona
          mejor como bloque: es el rótulo de la barra entera y no una fila más.

          El nombre del negocio está para contestar de un vistazo cuál de los
          clientes se está mirando, que en una app multi-cliente es lo primero
          que hay que poder responder. Pero se calla cuando dice lo mismo que el
          logotipo que tiene justo arriba: ahí no contesta nada, es la misma
          palabra dos veces —una dibujada y otra escrita— una abajo de la otra.
          Le pasa al tenant nuestro y a ningún cliente.

          El logotipo hereda el color por `currentColor`, así sirve en los dos
          temas. */}
      <header className="flex min-w-0 shrink-0 flex-col items-center px-[18px] pb-5 pt-4">
        <Logo className="h-4 w-auto text-ink-primary" />
        {storeName && storeName.trim().toLowerCase() !== NOMBRE_MARCA && (
          <p className="mt-2 max-w-full truncate text-center text-[11.5px] text-ink-faint" title={storeName}>
            {storeName}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {/* Los `data-tour` son a quién señala el recorrido guiado (`Tour.jsx`).
            Van como atributo y no como una ref que suba hasta App a propósito:
            así el tour sabe de la barra sin que la barra sepa nada del tour. */}
        <div data-tour="nav-secciones" className="stagger space-y-px" style={{ '--stagger-base': '60ms' }}>
          {NAV_ITEMS.map(({ key, Icon }) => (
            <NavRow
              key={key}
              icon={<Icon size={16} />}
              label={t(`nav.${key}`)}
              count={key === 'inbox' && pendingCount > 0 ? pendingCount : null}
              dataTour={`nav-${key}`}
              active={key === 'inbox' ? inboxActive : current === key}
              onClick={() => onNavigate(key)}
            />
          ))}
        </div>

        <div data-tour="nav-carpetas">{children}</div>
      </div>

      {footer}

      <div className="flex shrink-0 items-center gap-2 border-t border-tint/[0.07] px-3 py-2.5">
        <Avatar admin name={username} size={28} className="!rounded-full !text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium capitalize text-ink-primary">{username}</p>
          <p className="truncate text-[10.5px] text-ink-faint">{t('comun.administrador')}</p>
        </div>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? t('comun.temaClaro') : t('comun.temaOscuro')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
        >
          {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>
        <button
          onClick={onLogout}
          title={t('comun.cerrarSesion')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
        >
          <IconLogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
