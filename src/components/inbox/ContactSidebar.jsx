import { useState } from 'react'
import Avatar from '../ui/Avatar'
import { LIFECYCLES } from '../../data/mockData'
import { findAgent } from '../../utils/agents'
import { IconContactCard, IconChart, IconNote, IconPhone, IconBolt } from '../ui/icons'

const TABS = [
  { key: 'contacto', label: 'Contacto', Icon: IconContactCard },
  { key: 'actividad', label: 'Actividad', Icon: IconChart },
  { key: 'notas', label: 'Notas internas', Icon: IconNote },
]

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-white/30">{label}</p>
      <div className="mt-0.5 text-[12.5px] text-white/80">{children}</div>
    </div>
  )
}

function Metric({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
      <p className={`text-[17px] font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[10.5px] text-white/35">{label}</p>
    </div>
  )
}

// Rail de la derecha: los mismos íconos de la referencia, pero cada uno abre un
// panel con datos que ya tenemos del contacto en vez de ser decorativo.
export default function ContactSidebar({ group, agents = [], onChangeAgent, onAddTag, onRemoveTag }) {
  const [openTab, setOpenTab] = useState(null)
  // null = no se está escribiendo ninguna etiqueta nueva.
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState(null)

  const stage = group ? LIFECYCLES.find((s) => s.key === group.lifecycle) ?? LIFECYCLES[0] : null
  const agent = group ? findAgent(agents, group.agent) : null
  const notas = group?.messages.filter((m) => m.direction === 'nota') ?? []
  const entrantes = group?.messages.filter((m) => m.direction === 'in') ?? []
  const ultimaRespuesta = [...(group?.messages ?? [])].reverse().find((m) => m.direction === 'out')

  const toggle = (key) => setOpenTab((prev) => (prev === key ? null : key))

  return (
    <div className="flex h-full shrink-0">
      {/* El panel se anima desde ancho cero: montado siempre, así abrir y cerrar
          se ve como un cajón y no como un salto. */}
      <div
        className={`overflow-hidden border-l border-white/[0.07] bg-[#0a0a0a] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          openTab && group ? 'w-[272px]' : 'w-0'
        }`}
      >
        {group && openTab && (
          <div className="h-full w-[272px] overflow-y-auto p-4">
            {openTab === 'contacto' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar name={group.customer} size={54} className="!rounded-full !text-[19px]" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-white">{group.customer}</p>
                    <p className="text-[11.5px] tabular-nums text-white/40">{group.phone}</p>
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <a
                      href={`tel:${group.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/75 transition-all duration-200 hover:bg-white/[0.09] hover:text-white"
                    >
                      <IconPhone size={12} />
                      Llamar
                    </a>
                    <button
                      onClick={() => navigator.clipboard?.writeText(group.phone)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/75 transition-all duration-200 hover:bg-white/[0.09] hover:text-white"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/[0.07] pt-3">
                  <Field label="Etapa">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{stage.emoji}</span>
                      {stage.label}
                    </span>
                  </Field>
                  {/* El agente lo elige el ruteador, pero se puede corregir a
                      mano acá: lo que se elija manda para los mensajes que
                      lleguen después en esta conversación. */}
                  <Field label="Atendida por">
                    {agents.length > 0 && onChangeAgent ? (
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px]">
                          {agent.emoji}
                        </span>
                        <select
                          value={agent.key ?? ''}
                          onChange={(e) => onChangeAgent(group.phone, e.target.value)}
                          className="w-full appearance-none rounded-lg border border-white/[0.07] bg-white/[0.04] py-1.5 pl-7 pr-6 text-[12.5px] text-white/80
                            transition-colors duration-200 hover:bg-white/[0.07] focus:border-white/30 focus:outline-none"
                        >
                          {!agents.some((a) => a.key === agent.key) && (
                            <option value={agent.key ?? ''}>{agent.name}</option>
                          )}
                          {agents.map((a) => (
                            <option key={a.key} value={a.key} className="bg-[#141414]">
                              {a.name}
                              {a.enabled ? '' : ' (apagado)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span>{agent.emoji}</span>
                        {agent.name}
                      </span>
                    )}
                  </Field>
                  <Field label="Responsable">
                    <span className="capitalize">{group.assignee ?? 'Sin asignar'}</span>
                  </Field>
                  <Field label="Canal">WhatsApp</Field>

                  {/* Etiquetas libres: a diferencia de la etapa, que es una
                      sola y describe en qué punto va la venta, acá se acumulan
                      ("mayorista" + "debe seña"). */}
                  <Field label="Etiquetas">
                    <div className="flex flex-wrap gap-1">
                      {(group.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="group/tag inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] py-[3px] pl-2 pr-1.5 text-[11px] text-white/75"
                        >
                          {tag}
                          {onRemoveTag && (
                            <button
                              onClick={() => onRemoveTag(group.phone, tag)}
                              title={`Quitar “${tag}”`}
                              className="text-white/30 transition-colors duration-150 hover:text-status-critical"
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
                            className="rounded-full border border-dashed border-white/15 px-2 py-[3px] text-[11px] text-white/45 transition-colors duration-200 hover:border-white/30 hover:text-white/75"
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
                            className="w-28 rounded-full border border-white/15 bg-white/[0.04] px-2 py-[3px] text-[11px] text-white placeholder:text-white/25 focus:border-white/35 focus:outline-none"
                          />
                        ))}

                      {(group.tags ?? []).length === 0 && nuevaEtiqueta === null && !onAddTag && (
                        <span className="text-[11.5px] text-white/30">sin etiquetas</span>
                      )}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {openTab === 'actividad' && (
              <div className="animate-fade-in space-y-3">
                <p className="text-[12px] font-semibold text-white">Actividad</p>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Mensajes" value={group.total} />
                  <Metric label="Del cliente" value={entrantes.length} />
                  <Metric
                    label="Pendientes"
                    value={group.pendientes}
                    tone={group.pendientes > 0 ? 'text-status-warning' : 'text-white'}
                  />
                  <Metric label="Automáticos" value={group.automaticos} />
                </div>
                <div className="space-y-3 border-t border-white/[0.07] pt-3">
                  {entrantes[0] && <Field label="Primer contacto">{formatTime(entrantes[0].createdAt)}</Field>}
                  {ultimaRespuesta && (
                    <Field label="Última respuesta">
                      <span className="inline-flex items-center gap-1.5">
                        {formatTime(ultimaRespuesta.createdAt)}
                        {ultimaRespuesta.author === 'bot' && (
                          <span className="inline-flex items-center gap-1 text-white/40">
                            <IconBolt size={10} />
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
                <p className="text-[12px] font-semibold text-white">Notas internas</p>
                {notas.length === 0 ? (
                  <p className="text-[11.5px] leading-relaxed text-white/35">
                    No hay notas en esta conversación. Escribí una con Ctrl + \ desde el cuadro de
                    mensaje.
                  </p>
                ) : (
                  notas.map((nota) => (
                    <div
                      key={nota.id}
                      className="rounded-lg border border-status-warning/20 bg-status-warning/[0.06] px-2.5 py-2"
                    >
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">
                        {nota.text}
                      </p>
                      <p className="mt-1 text-[10.5px] tabular-nums text-white/35">
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

      <div className="flex h-full w-[44px] shrink-0 flex-col items-center gap-1 border-l border-white/[0.07] bg-[#0a0a0a] py-3">
        {TABS.map(({ key, label, Icon }) => {
          const active = openTab === key
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              disabled={!group}
              title={label}
              aria-label={label}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
                disabled:cursor-not-allowed disabled:opacity-30
                ${active ? 'bg-violet-soft text-violet' : 'text-white/40 hover:bg-white/[0.06] hover:text-white'}`}
            >
              <Icon size={16} />
              {key === 'notas' && notas.length > 0 && !active && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-status-warning" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
