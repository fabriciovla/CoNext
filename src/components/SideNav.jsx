import Avatar from './ui/Avatar'
import Logo from './ui/Logo'
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

const NAV_ITEMS = [
  { key: 'home', label: 'Inicio', Icon: IconHome },
  { key: 'inbox', label: 'Bandeja', Icon: IconInbox },
  { key: 'agents', label: 'Agentes IA', Icon: IconSparkles },
  { key: 'products', label: 'Productos', Icon: IconBox },
  { key: 'templates', label: 'Plantillas', Icon: IconTemplate },
  { key: 'settings', label: 'Configuración', Icon: IconSettings },
]

// Fila de la barra: ícono (o emoji), nombre y cantidad a la derecha. Es el
// ladrillo de toda la columna — secciones de la app y carpetas de la bandeja
// usan la misma fila, así que la selección y el hover se definen una sola vez.
export function NavRow({ icon, emoji, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      // El ítem activo se dice solo con el fondo y el peso del texto. Antes
      // llevaba además una barrita violeta pegada al borde izquierdo: era una
      // segunda marca para lo mismo, y con una por cada sección, carpeta y
      // agente, la columna quedaba con una fila de rayitas al costado.
      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px]
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
}) {
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-tint/[0.07] bg-surface-nav">
      {/* El logotipo y, debajo, de qué negocio es esta bandeja. Antes iba el
          logotipo solo y centrado: centrado no se alinea con nada —las filas de
          abajo arrancan a 18px del borde— y solo, no dice cuál de los clientes
          se está mirando, que en una app multi-cliente es lo primero que hay
          que poder responder de un vistazo. El logotipo hereda el color por
          `currentColor`, así sirve en los dos temas.
          Los 18px son los mismos que la fila: `px-2` del contenedor más `px-2.5`
          de `NavRow`, así el logotipo empieza donde empiezan los íconos. */}
      <header className="min-w-0 shrink-0 px-[18px] pb-5 pt-4">
        <Logo className="h-4 w-auto text-ink-primary" />
        {storeName && (
          <p className="mt-2 truncate text-[11.5px] text-ink-faint" title={storeName}>
            {storeName}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="stagger space-y-px" style={{ '--stagger-base': '60ms' }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <NavRow
              key={key}
              icon={<Icon size={16} />}
              label={label}
              count={key === 'inbox' && pendingCount > 0 ? pendingCount : null}
              active={current === key}
              onClick={() => onNavigate(key)}
            />
          ))}
        </div>

        {children}
      </div>

      {footer}

      <div className="flex shrink-0 items-center gap-2 border-t border-tint/[0.07] px-3 py-2.5">
        <Avatar name={username} size={28} className="!rounded-full !text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium capitalize text-ink-primary">{username}</p>
          <p className="truncate text-[10.5px] text-ink-faint">Administrador</p>
        </div>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
        >
          {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
        >
          <IconLogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
