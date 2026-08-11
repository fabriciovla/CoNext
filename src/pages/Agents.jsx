import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import {
  IconPlus,
  IconSparkles,
  IconBolt,
  IconClock,
  IconUsers,
  IconChevronDown,
} from '../components/ui/icons'

const EMPTY = { name: '', emoji: '🤖', role: '', instructions: '', enabled: true, autoSend: true }
const EMOJI_PICKS = ['🤖', '💼', '🎧', '📦', '💳', '✨', '🛍️', '📣', '🧾', '🚚']

const TEXTAREA_CLASS = `w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm leading-relaxed text-ink-primary
  placeholder:text-ink-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
  focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10`

function Field({ id, label, hint, children }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-muted">{hint}</span>}
    </label>
  )
}

function MoveButton({ title, disabled, onClick, rotate = '' }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-6 items-center justify-center rounded-md text-ink-muted transition-all duration-200
        hover:bg-white/[0.06] hover:text-ink-primary active:scale-95
        disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
    >
      <IconChevronDown size={13} className={rotate} />
    </button>
  )
}

function Stat({ Icon, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-ink-muted" />
      <div className="min-w-0 leading-tight">
        <p className="text-[13px] font-semibold tabular-nums text-ink-primary">{value}</p>
        <p className="truncate text-[10.5px] text-ink-muted">{label}</p>
      </div>
    </div>
  )
}

function AgentForm({ agent, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(agent ?? EMPTY)
  const set = (field) => (e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))
  const toggle = (field) => (value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSubmit({ ...draft, name: draft.name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <div className="w-[92px] shrink-0">
          <Field id="emoji" label="Ícono">
            <input
              id="emoji"
              value={draft.emoji}
              onChange={set('emoji')}
              maxLength={4}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-lg
                transition-all duration-300 focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </Field>
        </div>
        <div className="min-w-0 flex-1">
          <Input
            id="name"
            label="Nombre"
            placeholder="Agente de ventas"
            value={draft.name}
            onChange={set('name')}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EMOJI_PICKS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, emoji }))}
            className={`h-8 w-8 rounded-lg border text-base transition-all duration-200 hover:-translate-y-px ${
              draft.emoji === emoji
                ? 'border-white/40 bg-white/10'
                : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <Field
        id="role"
        label="Cuándo interviene"
        hint="Es lo único que lee el ruteador para decidir a quién le toca cada mensaje. Escribilo como una lista de casos concretos."
      >
        <textarea id="role" rows={3} value={draft.role} onChange={set('role')} className={TEXTAREA_CLASS} />
      </Field>

      <Field
        id="instructions"
        label="Cómo responde"
        hint="Se suma al prompt cuando este agente redacta. No puede saltearse las reglas de la tienda (catálogo, horarios, nada de inventar precios)."
      >
        <textarea
          id="instructions"
          rows={4}
          value={draft.instructions}
          onChange={set('instructions')}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <div className="space-y-2">
        <Switch
          checked={draft.enabled}
          onChange={toggle('enabled')}
          label="Agente activo"
          hint="Si está apagado, el ruteador no se lo ofrece y sus conversaciones pasan al primer agente activo."
        />
        <Switch
          checked={draft.autoSend}
          onChange={toggle('autoSend')}
          label="Envío automático"
          hint="Apagado, todo lo que redacte queda como borrador para revisar antes de mandarlo."
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{agent ? 'Guardar cambios' : 'Crear agente'}</Button>
      </div>
    </form>
  )
}

export default function Agents({ agents, stats, error, onAdd, onUpdate, onDelete, onReorder }) {
  const [editing, setEditing] = useState(null) // agente | 'nuevo' | null
  const [confirmDelete, setConfirmDelete] = useState(null)

  const move = (index, delta) => {
    const next = [...agents]
    const [moved] = next.splice(index, 1)
    next.splice(index + delta, 0, moved)
    onReorder(next.map((a) => a.id)).catch(() => {})
  }

  const handleSubmit = (draft) => {
    const action = editing === 'nuevo' ? onAdd(draft) : onUpdate(editing.id, draft)
    action.then(() => setEditing(null)).catch(() => {})
  }

  const handleDelete = () => {
    onDelete(confirmDelete.id)
      .then(() => setConfirmDelete(null))
      .catch(() => {})
  }

  return (
    <div>
      <PageHeader
        title="Agentes IA"
        subtitle="Quién atiende cada tipo de mensaje y cómo responde"
        actions={
          <Button onClick={() => setEditing('nuevo')}>
            <IconPlus size={14} />
            Nuevo agente
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <IconSparkles size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Cuando entra un mensaje, primero se decide{' '}
            <span className="text-ink-primary">qué agente lo toma</span> comparándolo con el “cuándo
            interviene” de cada uno. Después ese agente redacta la respuesta con sus propias
            instrucciones y la clasifica en automática o pendiente. El orden de la lista importa: el
            primero activo es el que se usa como respaldo si el ruteo no encuentra nada claro.
          </p>
        </div>
      </Card>

      {error && (
        <p className="animate-fade-down mb-4 rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      <div className="stagger grid gap-3 md:grid-cols-2" style={{ '--stagger-base': '60ms' }}>
        {agents.map((agent, index) => {
          const s = stats[agent.key] ?? { conversations: 0, handled: 0, automatic: 0, pending: 0 }
          return (
            <Card key={agent.id} bodyClassName="p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-lg transition-opacity ${
                    agent.enabled ? '' : 'opacity-40 grayscale'
                  }`}
                >
                  {agent.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-ink-primary">{agent.name}</h3>
                    {!agent.enabled && (
                      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-ink-muted">
                        Apagado
                      </span>
                    )}
                    {agent.enabled && !agent.autoSend && (
                      <span className="shrink-0 rounded-full border border-status-warning/25 bg-status-warning/10 px-2 py-0.5 text-[10.5px] text-status-warning">
                        Solo borradores
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">
                    {agent.role || 'Sin criterio de entrada definido.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-3">
                <Stat Icon={IconUsers} value={s.conversations} label="charlas" />
                <Stat Icon={IconSparkles} value={s.handled} label="atendidos" />
                <Stat Icon={IconBolt} value={s.automatic} label="autom." />
                <Stat Icon={IconClock} value={s.pending} label="pendientes" />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Switch
                  checked={agent.enabled}
                  onChange={(enabled) => onUpdate(agent.id, { enabled }).catch(() => {})}
                  label="Activo"
                />
                <div className="flex shrink-0 items-center gap-2">
                  {/* Subir/bajar en la lista: el primer agente activo es el que
                      se usa de respaldo cuando el ruteo no encuentra nada claro. */}
                  <div className="flex items-center">
                    <MoveButton
                      title="Subir"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      rotate="rotate-180"
                    />
                    <MoveButton
                      title="Bajar"
                      disabled={index === agents.length - 1}
                      onClick={() => move(index, 1)}
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(agent)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(agent)}>
                    Borrar
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {agents.length === 0 && (
        <Card>
          <p className="py-6 text-center text-[13px] text-ink-muted">
            No hay agentes cargados. Sin al menos uno activo, los mensajes entrantes quedan
            pendientes de revisión.
          </p>
        </Card>
      )}

      {editing && (
        <Modal
          width="lg"
          title={editing === 'nuevo' ? 'Nuevo agente' : `Editar ${editing.name}`}
          onClose={() => setEditing(null)}
        >
          <AgentForm
            agent={editing === 'nuevo' ? null : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Borrar agente" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Se va a borrar <span className="text-ink-primary">{confirmDelete.name}</span>. Las
            conversaciones que venía atendiendo pasan al primer agente activo; el historial de
            mensajes queda como está.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Borrar agente
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
