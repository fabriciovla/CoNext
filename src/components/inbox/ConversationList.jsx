import { useState } from 'react'
import { SkeletonLinea } from '../ui/Skeleton'
import Avatar from '../ui/Avatar'
import Switch from '../ui/Switch'
import Select from '../ui/Select'
import ChannelMark from '../ui/ChannelMark'
import { stripFormat } from '../ui/FormattedText'
import { formatTime } from '../../utils/time'
import { useT } from '../../lib/i18n.jsx'
import {
  IconCompose,
  IconSearch,
  IconArrowIn,
  IconArrowOut,
  IconBolt,
  IconNote,
} from '../ui/icons'

const TABS = ['chats', 'llamadas']
const ORDENES = ['recientes', 'antiguas', 'pendientes']

// Avatar del contacto con el distintivo del canal, que es lo que hace que la
// fila se lea como un chat y no como un registro.
//
// El logo estaba fijo en el de WhatsApp, de cuando era el unico canal. Ahora
// sale de la conversacion: es el unico lugar de la lista que dice por donde
// se contesta, y contestar por el canal equivocado no se deshace.
function ChannelAvatar({ name, channel, size = 38 }) {
  return (
    <div className="relative shrink-0">
      <Avatar photo name={name} size={size} className="!rounded-full" />
      <ChannelMark channel={channel} size={15} className="absolute -bottom-0.5 -right-0.5" />
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
  cargando = false,
}) {
  const t = useT()
  const [tab, setTab] = useState('chats')
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div
      data-tour="inbox-lista"
      className="flex h-full w-[336px] shrink-0 flex-col border-r border-tint/[0.07] bg-surface-card"
    >
      <header className="shrink-0 px-3 pt-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-tint/[0.07]">
          <div className="flex items-center gap-4">
            {TABS.map((clave) => {
              const active = tab === clave
              return (
                <button
                  key={clave}
                  onClick={() => setTab(clave)}
                  className={`relative pb-2.5 pt-1 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'text-violet' : 'text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  {t(`bandeja.tab${clave.charAt(0).toUpperCase()}${clave.slice(1)}`)}
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
              title={t('bandeja.nuevaConversacion')}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
            >
              <IconCompose size={15} />
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              title={t('comun.buscar')}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary ${
                searchOpen || search ? 'text-ink-primary' : 'text-ink-muted'
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
              placeholder={t('bandeja.buscarPlaceholder')}
              className="w-full rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[12px] text-ink-primary placeholder:text-ink-faint
                transition-all duration-200 focus:border-tint/25 focus:bg-tint/[0.07] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 py-2">
          <Select
            variant="plain"
            ariaLabel={t('bandeja.ordenar')}
            value={orden}
            onChange={onOrdenChange}
            options={ORDENES.map((value) => ({
              value,
              label: t(`bandeja.orden${value.charAt(0).toUpperCase()}${value.slice(1)}`),
            }))}
          />

          {/* El mismo `Switch` que la ficha del agente: era un interruptor
              dibujado a mano, con su propia palanca y su propio tamaño. Uno
              solo alcanza — y de paso trae el `role="switch"` que al de acá le
              faltaba. */}
          <Switch
            block={false}
            checked={unreplied}
            onChange={onUnrepliedChange}
            label={t('bandeja.sinResponder')}
            title={t('bandeja.sinResponderTitle')}
          />
        </div>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {tab === 'llamadas' ? (
          <li className="animate-fade-in px-3 py-12 text-center text-[12.5px] leading-relaxed text-ink-faint">
            {t('bandeja.sinLlamadas')}
            <br />
            {t('bandeja.sinLlamadasPie')}
          </li>
        ) : cargando && groups.length === 0 ? (
          // La lista vacía del arranque no es "no hay conversaciones": es que
          // todavía no contestó el server. La fila tiene la forma de la de
          // verdad —el redondel del avatar, el nombre y el renglón del último
          // mensaje— para que al llegar se rellene en lugar de aparecer.
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-start gap-2.5 px-2 py-2" aria-hidden="true">
              <SkeletonLinea className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5 pt-1">
                <SkeletonLinea className={`h-2.5 ${['w-[52%]', 'w-[38%]', 'w-[45%]'][i % 3]}`} />
                <SkeletonLinea className={`h-2.5 ${['w-[78%]', 'w-[64%]', 'w-[85%]'][i % 3]}`} />
              </div>
            </li>
          ))
        ) : (
          groups.map((group, i) => {
            const active = group.phone === selectedPhone
            return (
              <li
                key={group.phone}
                className="animate-fade-up"
                style={{ '--d': `${Math.min(i, 8) * 25}ms` }}
              >
                <button
                  onClick={() => onSelect(group.phone)}
                  // La conversación abierta se dice con el fondo del bloque y
                  // nada más. La barrita violeta del borde izquierdo era una
                  // segunda marca para lo mismo.
                  className={`group/item flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left
                    transition-colors duration-150
                    ${active ? 'bg-violet-soft' : 'hover:bg-tint/[0.045]'}`}
                >
                  <ChannelAvatar name={group.customer} channel={group.channel} size={38} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13.5px] font-medium text-ink-primary">{group.customer}</p>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-ink-faint">
                        {formatTime(group.lastAt)}
                      </span>
                    </div>

                    {/* Los indicadores comparten renglón con el último mensaje.
                        Tenían uno propio alineado a la derecha, y esa fila sola
                        le sumaba media fila de alto a cada conversación de la
                        lista para mostrar dos íconos. */}
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {group.lastFromStore ? (
                        <IconArrowOut size={13} className="shrink-0 text-ink-faint" />
                      ) : (
                        <IconArrowIn size={13} className="shrink-0 text-[#25d366]" />
                      )}
                      <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted">
                        {stripFormat(group.lastText)}
                      </p>
                      {/* El tooltip va en el span y no en el <svg>: como
                          atributo del SVG el navegador no lo muestra. */}
                      {group.notas > 0 && (
                        <span title={t('bandeja.tieneNotas')} className="flex shrink-0 text-ink-faint">
                          <IconNote size={12} />
                        </span>
                      )}
                      {group.lastFromBot && (
                        <span title={t('bandeja.ultimaDeAgente')} className="flex shrink-0 text-ink-faint">
                          <IconBolt size={12} />
                        </span>
                      )}
                      {group.pendientes > 0 && (
                        <span className="animate-pop-in flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-status-warning px-1 text-[10px] font-bold text-status-ink">
                          {group.pendientes}
                        </span>
                      )}
                      {/* Sin responsable no se dibuja nada: el círculo punteado
                          de "sin asignar" estaba en casi todas las filas, y el
                          hueco vacío dice lo mismo sin ocupar lugar. */}
                      {group.assignee && (
                        <span
                          title={t('bandeja.responsableTitle', { nombre: group.assignee })}
                          className="flex shrink-0"
                        >
                          <Avatar name={group.assignee} size={16} className="!rounded-full !text-[8px]" />
                        </span>
                      )}
                    </div>

                    {/* Etiquetas del contacto. Van en su propia fila porque son
                        de largo variable: mezcladas con los íconos de estado,
                        los empujarían fuera de la fila. */}
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
                          <span className="text-[10.5px] text-ink-faint">+{group.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            )
          })
        )}

        {tab === 'chats' && groups.length === 0 && (
          <li className="animate-fade-in px-3 py-12 text-center text-[12.5px] text-ink-faint">
            {t('bandeja.listaVacia')}
          </li>
        )}
      </ul>
    </div>
  )
}
