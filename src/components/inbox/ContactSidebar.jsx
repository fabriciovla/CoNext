import { useState } from 'react'
import Avatar from '../ui/Avatar'
import Select from '../ui/Select'
import { findAgent } from '../../utils/agents'
import { formatPhone, toE164 } from '../../utils/phone'
import { formatTime } from '../../utils/time'
import {
  IconContactCard,
  IconChart,
  IconNote,
  IconPhone,
  IconBolt,
  IconCheckCircle,
  IconSearch,
} from '../ui/icons'

const TABS = [
  { key: 'contacto', label: 'Contacto', Icon: IconContactCard },
  { key: 'actividad', label: 'Actividad', Icon: IconChart },
  { key: 'notas', label: 'Notas internas', Icon: IconNote },
]

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[12.5px] text-ink-faint">{label}</p>
      <div className="mt-1 text-[14px] text-ink-primary">{children}</div>
    </div>
  )
}

// El "(apagado)" que antes iba pegado al nombre pasa a ser una nota aparte: en
// el nativo no había otra forma de decirlo que meterlo adentro del texto.
//
// Si la conversación quedó atada a un agente que ya no está en la lista (se
// borró, o el ruteador guardó una key que no existe), igual tiene que aparecer
// como opción: si no, el desplegable mostraría a otro agente como si fuera el
// que atiende.
function opcionesDeAgente(agents, actual) {
  const opciones = agents.map((a) => ({
    value: a.key,
    label: a.name,
    hint: a.enabled ? undefined : 'apagado',
  }))
  if (actual?.key && !agents.some((a) => a.key === actual.key)) {
    opciones.unshift({ value: actual.key, label: actual.name })
  }
  return opciones
}

function Metric({ label, value, tone = 'text-ink-primary' }) {
  return (
    <div className="rounded-lg border border-tint/[0.07] bg-tint/[0.03] px-3 py-2.5">
      <p className={`text-[20px] font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11.5px] text-ink-faint">{label}</p>
    </div>
  )
}

// Rail de la derecha: los mismos íconos de la referencia, pero cada uno abre un
// panel con datos que ya tenemos del contacto en vez de ser decorativo.
export default function ContactSidebar({
  group,
  agents = [],
  username = 'admin',
  disabled = false,
  search = '',
  onSearchChange,
  onChangeAgent,
  onAddTag,
  onRemoveTag,
  onAssign,
  onResolve,
}) {
  // Arranca en "Contacto" y nunca queda vacío: los íconos cambian de pestaña,
  // no la apagan. Quién atiende, el responsable y las etiquetas son datos que se
  // miran *mientras* se contesta, y detrás de un click quedaban sin usar.
  const [openTab, setOpenTab] = useState('contacto')
  // null = no se está escribiendo ninguna etiqueta nueva.
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState(null)

  const agent = group ? findAgent(agents, group.agent) : null
  const notas = group?.messages.filter((m) => m.direction === 'nota') ?? []
  const entrantes = group?.messages.filter((m) => m.direction === 'in') ?? []
  const ultimaRespuesta = [...(group?.messages ?? [])].reverse().find((m) => m.direction === 'out')

  return (
    <div className="flex h-full shrink-0">
      {/* El panel se anima desde ancho cero: montado siempre, así abrir y cerrar
          se ve como un cajón y no como un salto. Sin conversación elegida no hay
          nada que mostrar, y ahí sí queda en cero. */}
      <div
        className={`overflow-hidden border-l border-tint/[0.07] bg-surface-nav transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          openTab && group ? 'w-[296px]' : 'w-0'
        }`}
      >
        {group && openTab && (
          <div className="h-full w-[296px] overflow-y-auto p-4">
            {openTab === 'contacto' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar photo name={group.customer} size={64} className="!rounded-full" />
                  <div>
                    <p className="text-[15.5px] font-semibold text-ink-primary">{group.customer}</p>
                    <p className="text-[13px] tabular-nums text-ink-muted">
                      {formatPhone(group.phone)}
                    </p>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <a
                      href={`tel:${toE164(group.phone)}`}
                      className="flex items-center gap-1.5 rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-1.5 text-[13px] text-ink-secondary transition-all duration-200 hover:bg-tint/[0.09] hover:text-ink-primary"
                    >
                      <IconPhone size={14} />
                      Llamar
                    </a>
                    <button
                      onClick={() => navigator.clipboard?.writeText(formatPhone(group.phone))}
                      className="rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-1.5 text-[13px] text-ink-secondary transition-all duration-200 hover:bg-tint/[0.09] hover:text-ink-primary"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Resolver es la acción de la conversación, no del contacto,
                    pero es la que más se toca: va sola y a lo ancho. Se apaga
                    cuando no hay nada pendiente, igual que en el header. */}
                {onResolve && (
                  <button
                    onClick={() => onResolve(group.phone)}
                    disabled={disabled || group.pendientes === 0}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-2 text-[13px] font-medium text-ink-secondary
                      transition-all duration-200 hover:bg-tint/[0.09] hover:text-ink-primary
                      disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-tint/[0.04]"
                  >
                    <IconCheckCircle size={15} />
                    {group.pendientes > 0 ? `Resolver ${group.pendientes} pendiente${group.pendientes > 1 ? 's' : ''}` : 'Sin pendientes'}
                  </button>
                )}

                {/* Buscador del hilo. Filtra los globos en vez de saltar de uno
                    en uno, que es lo que sirve cuando buscás "reintegro" en una
                    charla larga. */}
                {onSearchChange && (
                  <div className="relative">
                    <IconSearch
                      size={14}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    />
                    <input
                      value={search}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="Buscar en la conversación"
                      className="w-full rounded-lg border border-tint/10 bg-tint/[0.04] py-2 pl-8 pr-3 text-[13px] text-ink-primary placeholder:text-ink-faint
                        transition-all duration-200 focus:border-tint/25 focus:bg-tint/[0.07] focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-3 border-t border-tint/[0.07] pt-3">
                  {/* El agente lo elige el ruteador, pero se puede corregir a
                      mano acá: lo que se elija manda para los mensajes que
                      lleguen después en esta conversación. */}
                  <Field label="Atendida por">
                    {agents.length > 0 && onChangeAgent ? (
                      <Select
                        ariaLabel="Agente que atiende la conversación"
                        value={agent.key ?? ''}
                        onChange={(key) => onChangeAgent(group.phone, key)}
                        options={opcionesDeAgente(agents, agent)}
                      />
                    ) : (
                      <span className="min-w-0 truncate">{agent.name}</span>
                    )}
                  </Field>
                  {/* Asignar era un menú desplegable en el header. Acá alcanza
                      un botón que alterna: las dos únicas opciones eran
                      tomarla y soltarla, y cuál de las dos corresponde ya lo
                      dice quién la tiene. */}
                  <Field label="Responsable">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate capitalize">
                        {group.assignee ?? 'Sin asignar'}
                      </span>
                      {onAssign && (
                        <button
                          onClick={() => onAssign(group.phone, group.assignee === username ? null : username)}
                          className="shrink-0 rounded-md border border-tint/10 px-2 py-1 text-[12px] text-ink-muted
                            transition-colors duration-200 hover:bg-tint/[0.07] hover:text-ink-primary"
                        >
                          {group.assignee === username ? 'Soltar' : 'Tomarla'}
                        </button>
                      )}
                    </div>
                  </Field>
                  <Field label="Canal">WhatsApp</Field>

                  {/* Etiquetas libres: se acumulan ("mayorista" + "debe seña")
                      y son lo único que el equipo escribe sobre el contacto. */}
                  <Field label="Etiquetas">
                    <div className="flex flex-wrap gap-1">
                      {(group.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="group/tag inline-flex items-center gap-1 rounded-full border border-tint/10 bg-tint/[0.05] py-[3px] pl-2.5 pr-2 text-[12px] text-ink-secondary"
                        >
                          {tag}
                          {onRemoveTag && (
                            <button
                              onClick={() => onRemoveTag(group.phone, tag)}
                              title={`Quitar “${tag}”`}
                              className="text-ink-faint transition-colors duration-150 hover:text-status-critical"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}

                      {onAddTag &&
                        (nuevaEtiqueta === null ? (
                          <button
                            onClick={() => setNuevaEtiqueta('')}
                            className="rounded-full border border-dashed border-tint/15 px-2.5 py-[3px] text-[12px] text-ink-muted transition-colors duration-200 hover:border-tint/30 hover:text-ink-secondary"
                          >
                            + etiqueta
                          </button>
                        ) : (
                          <input
                            autoFocus
                            value={nuevaEtiqueta}
                            onChange={(e) => setNuevaEtiqueta(e.target.value)}
                            onBlur={() => setNuevaEtiqueta(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && nuevaEtiqueta.trim()) {
                                onAddTag(group.phone, nuevaEtiqueta)
                                setNuevaEtiqueta('')
                              }
                              if (e.key === 'Escape') setNuevaEtiqueta(null)
                            }}
                            placeholder="nombre y Enter"
                            className="w-32 rounded-full border border-tint/15 bg-tint/[0.04] px-2.5 py-[3px] text-[12px] text-ink-primary placeholder:text-ink-faint focus:border-tint/35 focus:outline-none"
                          />
                        ))}

                      {(group.tags ?? []).length === 0 && nuevaEtiqueta === null && !onAddTag && (
                        <span className="text-[12.5px] text-ink-faint">sin etiquetas</span>
                      )}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {openTab === 'actividad' && (
              <div className="animate-fade-in space-y-3">
                <p className="text-[13.5px] font-semibold text-ink-primary">Actividad</p>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Mensajes" value={group.total} />
                  <Metric label="Del cliente" value={entrantes.length} />
                  <Metric
                    label="Pendientes"
                    value={group.pendientes}
                    tone={group.pendientes > 0 ? 'text-status-warning' : 'text-ink-primary'}
                  />
                  <Metric label="Automáticos" value={group.automaticos} />
                </div>
                <div className="space-y-3 border-t border-tint/[0.07] pt-3">
                  {entrantes[0] && <Field label="Primer contacto">{formatTime(entrantes[0].createdAt)}</Field>}
                  {ultimaRespuesta && (
                    <Field label="Última respuesta">
                      <span className="inline-flex items-center gap-1.5">
                        {formatTime(ultimaRespuesta.createdAt)}
                        {ultimaRespuesta.author === 'bot' && (
                          <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted">
                            <IconBolt size={12} />
                            automática
                          </span>
                        )}
                      </span>
                    </Field>
                  )}
                </div>
              </div>
            )}

            {openTab === 'notas' && (
              <div className="animate-fade-in space-y-2.5">
                <p className="text-[13.5px] font-semibold text-ink-primary">Notas internas</p>
                {notas.length === 0 ? (
                  <p className="text-[12.5px] leading-relaxed text-ink-faint">
                    No hay notas en esta conversación. Escribí una con Ctrl + \ desde el cuadro de
                    mensaje.
                  </p>
                ) : (
                  notas.map((nota) => (
                    <div
                      key={nota.id}
                      className="rounded-lg border border-status-warning/20 bg-status-warning/[0.06] px-3 py-2.5"
                    >
                      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-primary">
                        {nota.text}
                      </p>
                      <p className="mt-1 text-[11.5px] tabular-nums text-ink-faint">
                        {formatTime(nota.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex h-full w-[52px] shrink-0 flex-col items-center gap-1 border-l border-tint/[0.07] bg-surface-nav py-3">
        {TABS.map(({ key, label, Icon }) => {
          const active = openTab === key
          return (
            <button
              key={key}
              onClick={() => setOpenTab(key)}
              disabled={!group}
              title={label}
              aria-label={label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
                disabled:cursor-not-allowed disabled:opacity-30
                ${active ? 'bg-violet-soft text-violet' : 'text-ink-muted hover:bg-tint/[0.06] hover:text-ink-primary'}`}
            >
              <Icon size={20} />
              {key === 'notas' && notas.length > 0 && !active && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-status-warning" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
