import Avatar from './ui/Avatar'
import {
  IconHome,
  IconInbox,
  IconBox,
  IconSettings,
  IconLogOut,
  IconChevronDown,
  IconSidebarToggle,
  IconSparkles,
} from './ui/icons'

const NAV_ITEMS = [
  { key: 'home', label: 'Inicio', Icon: IconHome },
  { key: 'inbox', label: 'Bandeja', Icon: IconInbox },
  { key: 'agents', label: 'Agentes IA', Icon: IconSparkles },
  { key: 'products', label: 'Productos', Icon: IconBox },
  { key: 'settings', label: 'Configuración', Icon: IconSettings },
]

// Fila de la barra: ícono (o emoji), nombre y cantidad a la derecha. Es el
// ladrillo de toda la columna — secciones de la app y carpetas de la bandeja
// usan la misma fila, así que la selección y el hover se definen una sola vez.
export function NavRow({ icon, emoji, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px]
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${active ? 'bg-white/[0.09] font-medium text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'}`}
    >
      {/* Marca vertical del ítem activo: crece desde el centro. */}
      <span
        className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-violet transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? 'h-5 opacity-100' : 'h-0 opacity-0'
        }`}
      />
      {emoji ? (
        <span className="w-[16px] shrink-0 text-center text-[13.5px] leading-none">{emoji}</span>
      ) : (
        <span className={`shrink-0 ${active ? 'text-white' : 'text-white/45 group-hover:text-white/80'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span
          className={`shrink-0 text-[11.5px] tabular-nums ${active ? 'text-white/80' : 'text-white/35 group-hover:text-white/60'}`}
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
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/35 transition-colors group-hover:text-white/60">
          {title}
        </span>
        <IconChevronDown
          size={13}
          className={`shrink-0 text-white/35 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-white/60 ${
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
  onLogout,
  pendingCount = 0,
  onCollapse,
  children,
  footer,
}) {
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0a0a]">
      <header className="flex shrink-0 items-center gap-2.5 px-3.5 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-[13px] font-bold text-white">
          W
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">WhatsApp CRM</p>
          <p className="truncate text-[10.5px] text-white/35">Panel de administración</p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Ocultar barra"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
          >
            <IconSidebarToggle size={15} />
          </button>
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

      <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] px-3 py-2.5">
        <Avatar name={username} size={28} className="!rounded-full !text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium capitalize text-white/85">{username}</p>
          <p className="truncate text-[10.5px] text-white/35">Administrador</p>
        </div>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
        >
          <IconLogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
