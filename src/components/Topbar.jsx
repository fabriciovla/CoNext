import Avatar from './ui/Avatar'
import { IconSearch, IconInbox, IconBell } from './ui/icons'

export default function Topbar({ username }) {
  return (
    <div className="animate-fade-down flex items-center justify-between gap-4">
      <label className="group relative w-full max-w-xs">
        <IconSearch
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-colors duration-200 group-focus-within:text-white"
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-ink-primary placeholder:text-ink-muted
            transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10"
        />
      </label>

      <div className="flex shrink-0 items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white opacity-70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:opacity-100 active:translate-y-0 active:scale-95">
          <IconInbox size={15} />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white opacity-70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:opacity-100 active:translate-y-0 active:scale-95">
          <IconBell size={15} />
          {/* Aviso sin leer: halo suave para que se note sin distraer. */}
          <span className="absolute right-2 top-2 flex h-1.5 w-1.5">
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-white" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </button>
        <div className="flex items-center gap-2.5 pl-1">
          <Avatar
            name={username}
            size={36}
            className="transition-transform duration-300 hover:scale-105"
          />
          <div className="leading-tight">
            <p className="text-sm font-medium capitalize text-ink-primary">{username}</p>
            <p className="text-xs text-ink-muted">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  )
}
