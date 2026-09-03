import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import { LABEL_CLASS } from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Switch from '../components/ui/Switch'
import { IconPlus, IconChevronDown, IconSparkles, IconTrash } from '../components/ui/icons'
import { useT } from '../lib/i18n.jsx'

const EMPTY = { name: '', role: '', instructions: '', enabled: true, autoSend: true }

const TEXTAREA_CLASS = `w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] leading-relaxed text-ink-primary
  placeholder:text-ink-faint transition-colors duration-150
  focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30`

function Field({ id, label, hint, children }) {
  return (
    <label htmlFor={id} className="block">
      <span className={LABEL_CLASS}>{label}</span>
      {hint && <span className="mb-2 block text-[12px] leading-snug text-ink-muted">{hint}</span>}
      {children}
    </label>
  )
}

// Acción de tarjeta: solo ícono, del tamaño del texto, y sin color hasta que el
// mouse entra. Las tres (subir, bajar, borrar) comparten forma porque ninguna es
// la acción principal — la principal es tocar la tarjeta, que abre el agente.
function IconAction({ title, onClick, disabled = false, danger = false, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink-muted
        ${
          danger
            ? 'hover:bg-status-critical/10 hover:text-status-critical'
            : 'hover:bg-tint/[0.06] hover:text-ink-primary'
        }`}
    >
      {children}
    </button>
  )
}

// Número del pie de la tarjeta: el rótulo arriba en chico y el dato abajo en
// grande. Son totales de siempre, no del día abierto.
function Dato({ label, value, tone = 'text-ink-primary', align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className={`text-[16px] font-semibold leading-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

function AgentForm({ agent, onSubmit, onCancel }) {
  const t = useT()
  const [draft, setDraft] = useState(agent ?? EMPTY)
  const set = (field) => (e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))
  const toggle = (field) => (value) => setDraft((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSubmit({ ...draft, name: draft.name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* `Field` y no el `Input` compartido porque los tres campos llevan una
          línea de ayuda debajo del rótulo; el rótulo en sí sale de la misma
          clase (`LABEL_CLASS`), así no hay dos tamaños de etiqueta conviviendo
          en el mismo formulario. */}
      <Field id="name" label={t('agentes.campoNombre')}>
        <input
          id="name"
          value={draft.name}
          onChange={set('name')}
          placeholder={t('agentes.campoNombrePlaceholder')}
          className="w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] text-ink-primary
            placeholder:text-ink-faint transition-colors duration-150
            focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30"
        />
      </Field>

      <Field
        id="role"
        label={t('agentes.campoRol')}
        hint={t('agentes.campoRolHint')}
      >
        <textarea
          id="role"
          rows={3}
          value={draft.role}
          onChange={set('role')}
          placeholder={t('agentes.campoRolPlaceholder')}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field
        id="instructions"
        label={t('agentes.campoInstrucciones')}
        hint={t('agentes.campoInstruccionesHint')}
      >
        <textarea
          id="instructions"
          rows={4}
          value={draft.instructions}
          onChange={set('instructions')}
          placeholder={t('agentes.campoInstruccionesPlaceholder')}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <div className="space-y-2">
        <Switch
          checked={draft.enabled}
          onChange={toggle('enabled')}
          label={t('agentes.switchEncendido')}
          hint={t('agentes.switchEncendidoHint')}
        />
        <Switch
          checked={draft.autoSend}
          onChange={toggle('autoSend')}
          label={t('agentes.switchAutoSend')}
          hint={t('agentes.switchAutoSendHint')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel}>
          {t('comun.cancelar')}
        </Button>
        <Button type="submit">
          {agent ? t('agentes.guardarCambios') : t('agentes.crearAgente')}
        </Button>
      </div>
    </form>
  )
}

export default function Agents({
  agents,
  stats,
  cargando = false,
  error,
  focus = null,
  onFocusHandled,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}) {
  const t = useT()
  const [editing, setEditing] = useState(null) // agente | 'nuevo' | null
  const [confirmDelete, setConfirmDelete] = useState(null)

  // La barra de la izquierda entra acá pidiendo un agente puntual (o uno nuevo).
  // El pedido se consume apenas se abre el formulario: si quedara colgado, cerrar
  // el modal y volver a tocar el mismo agente no haría nada.
  useEffect(() => {
    if (focus == null) return
    const target = focus === 'nuevo' ? 'nuevo' : agents.find((a) => a.id === focus)
    if (!target) return // los agentes todavía no llegaron; el efecto vuelve cuando lleguen
    setEditing(target)
    onFocusHandled()
  }, [focus, agents, onFocusHandled])

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

  // El que contesta cuando ningún agente encaja claro. Es el primero *encendido*,
  // no el primero de la lista, y se marca en su tarjeta para que el orden
  // signifique algo a simple vista.
  const porDefecto = agents.find((a) => a.enabled)

  return (
    <div>
      {/* La regla del orden ya se ve marcada en la lista, así que la bajada
          dice solo lo que no se ve: que el agente lo elige la consulta y que la
          tarjeta entera abre la configuración. */}
      <PageHeader
        title={t('agentes.titulo')}
        description={t('agentes.bajada')}
        actions={
          <Button onClick={() => setEditing('nuevo')}>
            <IconPlus size={14} />
            {t('agentes.nuevoAgente')}
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      {/* Una sola columna y no dos: el orden de la lista decide quién contesta
          cuando ningún agente encaja claro, y en dos columnas ese orden zigzaguea
          y deja de leerse. */}
      {/* `grid-cols-1` explícito y no `grid` a secas: sin columnas declaradas el
          item toma `min-width: auto` y no baja de su ancho mínimo de contenido,
          así que un rol largo estiraba la tarjeta más allá del `max-w` y dejaba
          el interruptor fuera de la pantalla. `grid-cols-1` la declara como
          `minmax(0, 1fr)`, que sí se deja encoger. */}
      <div className="grid grid-cols-1 gap-2">
        {agents.map((agent, index) => {
          const s = stats[agent.key] ?? { conversations: 0, handled: 0, automatic: 0, pending: 0 }
          const esPorDefecto = agent.enabled && porDefecto?.id === agent.id
          return (
            // La tarjeta se lee en tres bandas: arriba en qué estado está, en el
            // medio quién es y de qué se encarga, y abajo lo que viene haciendo.
            // Las bandas van con un fondo apenas distinto del cuerpo, que es lo
            // que las separa sin necesidad de más líneas.
            <Card key={agent.id} interactive className="group relative overflow-hidden" bodyClassName="p-0">
              {/* El botón cubre la tarjeta entera en vez de haber uno de "Editar":
                  abrir el agente es lo único que se hace acá seguido. El resto del
                  contenido no recibe clicks (`pointer-events-none`) y se los deja
                  pasar a este; los controles se los devuelven. */}
              <button
                type="button"
                onClick={() => setEditing(agent)}
                aria-label={t('agentes.editarNombre', { nombre: agent.name })}
                className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-violet/50"
              />

              <div className="pointer-events-none relative z-20 flex items-center gap-2 border-b border-tint/[0.06] bg-tint/[0.02] px-4 py-2.5">
                {/* El punto es el mismo que marca el día abierto en la barra:
                    verde es que está trabajando. */}
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.enabled ? 'bg-status-good' : 'bg-tint/30'}`}
                />
                <span className="text-[12px] text-ink-secondary">
                  {agent.enabled ? t('agentes.encendido') : t('agentes.apagado')}
                </span>
                {/* Los estados van como una palabra y no como pastillas de
                    color: son dos casos puntuales, no etiquetas de todos. */}
                {esPorDefecto && (
                  <span
                    className="truncate text-[12px] text-violet"
                    title={t('agentes.porDefectoTitle')}
                  >
                    {t('agentes.porDefecto')}
                  </span>
                )}
                {agent.enabled && !agent.autoSend && (
                  <span
                    className="truncate text-[12px] text-status-warning"
                    title={t('agentes.dejaBorradorTitle')}
                  >
                    {t('agentes.dejaBorrador')}
                  </span>
                )}

                {/* Reordenar y borrar aparecen al pasar el mouse: se usan una vez
                    cada tanto y estaban compitiendo con todo. El contenedor
                    reserva el lugar igual, para que nada salte. */}
                <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-1">
                  <div className="flex opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                    <IconAction
                      title={t('agentes.subirEnLista')}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <IconChevronDown size={13} className="rotate-180" />
                    </IconAction>
                    <IconAction
                      title={t('agentes.bajarEnLista')}
                      disabled={index === agents.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <IconChevronDown size={13} />
                    </IconAction>
                    <IconAction
                      title={t('agentes.borrarNombre', { nombre: agent.name })}
                      danger
                      onClick={() => setConfirmDelete(agent)}
                    >
                      <IconTrash size={15} />
                    </IconAction>
                  </div>
                  <Switch
                    block={false}
                    checked={agent.enabled}
                    onChange={(enabled) => onUpdate(agent.id, { enabled }).catch(() => {})}
                    title={
                      agent.enabled
                        ? t('agentes.apagarNombre', { nombre: agent.name })
                        : t('agentes.encenderNombre', { nombre: agent.name })
                    }
                  />
                </div>
              </div>

              <div className="pointer-events-none relative px-4 py-4">
                <h3 className="truncate text-[15px] font-semibold text-ink-primary">{agent.name}</h3>
                {/* Dos líneas y corta: el rol completo se lee adentro, y una
                    tarjeta que crece con el texto rompe el ritmo de la lista. */}
                {/* El techo de ancho es del párrafo y no de la tarjeta: la
                    tarjeta ocupa la columna entera —así los datos del pie
                    llegan hasta el borde derecho— y el rol se corta antes,
                    donde un renglón todavía se lee de un barrido. */}
                <p className="mt-1 line-clamp-2 max-w-3xl text-[13px] leading-relaxed text-ink-secondary">
                  {agent.role || t('agentes.sinRol')}
                </p>
              </div>

              <div className="pointer-events-none relative flex items-end justify-between gap-4 border-t border-tint/[0.06] bg-tint/[0.02] px-4 py-3">
                <div className="flex min-w-0 gap-6">
                  <Dato label={t('agentes.datoConversaciones')} value={s.conversations} />
                  <Dato label={t('agentes.datoMensajes')} value={s.handled} />
                  <Dato label={t('agentes.datoContestoSolo')} value={s.automatic} />
                </div>
                <Dato
                  label={t('agentes.datoParaRevisar')}
                  value={s.pending}
                  align="right"
                  tone={s.pending > 0 ? 'text-status-warning' : 'text-ink-muted'}
                />
              </div>
            </Card>
          )
        })}
      </div>

      {/* "Todavía no hay agentes" es una afirmación, y mientras la lista viaja
          todavía no se sabe: dibujarla es contarle al cliente algo falso
          durante medio segundo. */}
      {cargando && agents.length === 0 && (
        <Skeleton cards={3} lineas={2} className="grid grid-cols-1 gap-2" />
      )}

      {!cargando && agents.length === 0 && (
        <Card bodyClassName="p-0">
          <EmptyState
            icon={<IconSparkles size={19} />}
            title={t('agentes.vacioTitulo')}
            description={t('agentes.vacioTexto')}
            action={
              <Button onClick={() => setEditing('nuevo')}>
                <IconPlus size={14} />
                {t('agentes.nuevoAgente')}
              </Button>
            }
          />
        </Card>
      )}

      {editing && (
        <Modal
          width="lg"
          title={
            editing === 'nuevo'
              ? t('agentes.nuevoAgente')
              : t('agentes.editarNombre', { nombre: editing.name })
          }
          onClose={() => setEditing(null)}
        >
          <AgentForm
            // El borrador del formulario se arma una sola vez: sin `key`, pasar
            // de un agente a otro dejaría los datos del anterior.
            key={editing === 'nuevo' ? 'nuevo' : editing.id}
            agent={editing === 'nuevo' ? null : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={t('agentes.borrarAgente')} onClose={() => setConfirmDelete(null)}>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('agentes.seVaABorrar')} <span className="text-ink-primary">{confirmDelete.name}</span>.{' '}
            {t('agentes.borrarDetalle')}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('agentes.borrarAgente')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
