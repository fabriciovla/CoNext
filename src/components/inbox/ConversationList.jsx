import { useState } from 'react'
import Avatar from '../ui/Avatar'
import { LIFECYCLES } from '../../data/mockData'
import {
  IconCompose,
  IconSearch,
  IconChevronDown,
  IconArrowIn,
  IconArrowOut,
  IconBolt,
  IconNote,
  IconSidebarToggle,
} from '../ui/icons'

const TABS = [
  { key: 'chats', label: 'Chats' },
  { key: 'llamadas', label: 'Llamadas' },
]

const ORDENES = [
  { key: 'recientes', label: 'Abiertas, recientes' },
  { key: 'antiguas', label: 'Abiertas, antiguas' },
  { key: 'pendientes', label: 'Pendientes primero' },
]

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const stageOf = (key) => LIFECYCLES.find((s) => s.key === key) ?? LIFECYCLES[0]

// Etiqueta de etapa del contacto. Emoji + texto, igual que en la columna de
// carpetas: la misma etapa se reconoce en los dos lados sin leer.
function StageChip({ lifecycle }) {
  const stage = stageOf(lifecycle)
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-[3px] text-[11.5px] text-white/65">
      <span className="leading-none">{stage.emoji}</span>
      {stage.label}
    </span>
  )
}

// Avatar del contacto con el distintivo del canal: todo entra por WhatsApp,
// pero el punto verde es lo que hace que la fila se lea como un chat.
function ChannelAvatar({ name, size = 38 }) {
  return (
    <div className="relative shrink-0">
      <Avatar name={name} size={size} className="!rounded-full" />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#0d0d0d] bg-[#25d366]">
        <svg viewBox="0 0 24 24" className="h-2 w-2 fill-black/80">
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.9-5.1c-.4-.7-.7-1.5-.7-2.2s.4-1.2.7-1.4c.2-.2.4-.2.6-.2h.4c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.5.9 1.6 1.9 2.6 2.4.2.1.4.1.5 0l.7-.8c.2-.2.3-.2.5-.1l1.7.9c.2.1.3.2.4.3v.8Z" />
        </svg>
      </span>
    </div>
  )
}

export default function ConversationList({
  groups,
  selectedPhone,
  onSelect,
  unreplied,
  onUnrepliedChange,
  orden,
  onOrdenChange,
  search,
  onSearchChange,
  onExpandNav = null,
}) {
  const [tab, setTab] = useState('chats')
  const [ordenOpen, setOrdenOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const ordenActual = ORDENES.find((o) => o.key === orden) ?? ORDENES[0]

  return (
    <div className="flex h-full w-[336px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0d0d0d]">
      <header className="shrink-0 px-3 pt-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.07]">
          <div className="flex items-center gap-4">
            {/* Con las carpetas plegadas, el botón para traerlas de vuelta vive
                acá: flotando sobre la columna tapaba las pestañas. */}
            {onExpandNav && (
              <button
                onClick={onExpandNav}
                title="Mostrar carpetas"
                className="animate-fade-in -ml-0.5 mb-1.5 flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <IconSidebarToggle size={15} />
              </button>
            )}
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative pb-2.5 pt-1 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'text-violet' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  {t.label}
                  <span
                    className={`absolute -bottom-px left-0 h-[2px] rounded-full bg-violet transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-0.5 pb-1.5">
            <button
              title="Nueva conversación"
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
            >
              <IconCompose size={15} />
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              title="Buscar"
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 hover:bg-white/[0.06] hover:text-white ${
                searchOpen || search ? 'text-white' : 'text-white/40'
              }`}
            >
              <IconSearch size={15} />
            </button>
          </div>
        </div>

        {/* El buscador aparece sobre la lista en vez de ocupar una fila fija:
            la columna es angosta y esa fila se usa nueve de cada diez veces
            para ver conversaciones, no para buscar. */}
        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            searchOpen ? 'grid-rows-[1fr] pt-2 opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar contacto o mensaje..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/30
                transition-all duration-200 focus:border-white/25 focus:bg-white/[0.07] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 py-2">
          <div className="relative">
            <button
              onClick={() => setOrdenOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md px-1 py-1 text-[12px] font-medium text-white/70 transition-colors duration-200 hover:text-white"
            >
              {ordenActual.label}
              <IconChevronDown
                size={12}
                className={`transition-transform duration-300 ${ordenOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {ordenOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOrdenOpen(false)} />
                <ul className="animate-scale-in absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#161616] py-1 shadow-xl">
                  {ORDENES.map((o) => (
                    <li key={o.key}>
                      <button
                        onClick={() => {
                          onOrdenChange(o.key)
                          setOrdenOpen(false)
                        }}
                        className={`w-full px-3 py-1.5 text-left text-[12px] transition-colors duration-150 hover:bg-white/[0.07] ${
                          o.key === orden ? 'text-white' : 'text-white/60'
                        }`}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <button
            onClick={() => onUnrepliedChange(!unreplied)}
            className="group flex items-center gap-1.5"
            title="Mostrar solo las que esperan respuesta"
          >
            <span
              className={`relative h-[15px] w-[26px] rounded-full transition-colors duration-300 ${
                unreplied ? 'bg-violet' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-[2px] h-[11px] w-[11px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  unreplied ? 'left-[13px]' : 'left-[2px]'
                }`}
              />
            </span>
            <span className={`text-[12px] transition-colors duration-200 ${unreplied ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>
              Sin responder
            </span>
          </button>
        </div>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {tab === 'llamadas' ? (
          <li className="animate-fade-in px-3 py-12 text-center text-[12.5px] leading-relaxed text-white/35">
            Todavía no registramos llamadas.
            <br />
            Las conversaciones están en la pestaña Chats.
          </li>
        ) : (
          groups.map((group, i) => {
            const active = group.phone === selectedPhone
            return (
              <li
                key={group.phone}
                className="animate-fade-up"
                style={{ '--d': `${Math.min(i, 8) * 40}ms` }}
              >
                <button
                  onClick={() => onSelect(group.phone)}
                  className={`group/item relative flex w-full items-start gap-2.5 rounded-lg px-2 py-2.5 text-left
                    transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${active ? 'bg-violet-soft' : 'hover:bg-white/[0.045]'}`}
                >
                  {/* Barra del ítem activo, como la del rail: el mismo lenguaje
                      para "esto es lo que estás mirando" en toda la app. */}
                  <span
                    className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-violet transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active ? 'h-8 opacity-100' : 'h-0 opacity-0'
                    }`}
                  />
                  <ChannelAvatar name={group.customer} size={42} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13.5px] font-medium text-white">{group.customer}</p>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-white/35">
                        {formatTime(group.lastAt)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      {group.lastFromStore ? (
                        <IconArrowOut size={13} className="shrink-0 text-white/30" />
                      ) : (
                        <IconArrowIn size={13} className="shrink-0 text-[#25d366]" />
                      )}
                      <p className="min-w-0 flex-1 truncate text-[12.5px] text-white/45">{group.lastText}</p>
                      {group.pendientes > 0 && (
                        <span className="animate-pop-in flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-status-warning px-1 text-[10px] font-bold text-black">
                          {group.pendientes}
                        </span>
                      )}
                    </div>

                    {/* Etiquetas del contacto. Van arriba de la etapa y no al
                        lado porque son de largo variable: mezcladas en la misma
                        fila empujarían los íconos de la derecha. */}
                    {group.tags?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {group.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="max-w-[110px] truncate rounded-full border border-violet/20 bg-violet-soft px-1.5 py-[1px] text-[10.5px] text-violet"
                          >
                            {tag}
                          </span>
                        ))}
                        {group.tags.length > 3 && (
                          <span className="text-[10.5px] text-white/30">+{group.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <StageChip lifecycle={group.lifecycle} />
                      <span className="flex shrink-0 items-center gap-1.5 text-white/30">
                        {group.notas > 0 && <IconNote size={12} title="Tiene notas internas" />}
                        {group.lastFromBot && <IconBolt size={12} />}
                        {group.assignee ? (
                          <Avatar name={group.assignee} size={16} className="!rounded-full !text-[8px]" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-dashed border-white/20" title="Sin asignar" />
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            )
          })
        )}

        {tab === 'chats' && groups.length === 0 && (
          <li className="animate-fade-in px-3 py-12 text-center text-[12.5px] text-white/35">
            No hay conversaciones en esta vista.
          </li>
        )}
      </ul>
    </div>
  )
}
