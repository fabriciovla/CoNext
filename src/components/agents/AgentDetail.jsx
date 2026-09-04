import { useEffect, useRef, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Switch from '../ui/Switch'
import EmojiPicker from '../inbox/EmojiPicker'
import KnowledgeCard from './KnowledgeCard'
import AgentTester from './AgentTester'
import { LABEL_CLASS } from '../ui/Input'
import {
  IconBolt,
  IconBox,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconFile,
  IconNote,
  IconSparkles,
  IconTrash,
} from '../ui/icons'
import useAgentKnowledge from '../../hooks/useAgentKnowledge'
import { storeSchedule } from '../../utils/metrics'
import { useT } from '../../lib/i18n.jsx'

// La pantalla de un agente. Es la página entera y no un modal, y son dos
// columnas: a la izquierda lo que el agente es, a la derecha una conversación de
// prueba con él.
//
// Las dos mitades tienen que verse juntas. Editar un agente es un ciclo —cambio
// una instrucción, pregunto, leo lo que contesta, vuelvo a cambiar—, y con la
// configuración adentro de un modal ese ciclo son cuatro clicks por vuelta. Por
// eso también la columna de la derecha queda fija mientras la izquierda
// scrollea: la prueba no se pierde de vista aunque se esté editando abajo de
// todo.
//
// Un agente nuevo entra a esta misma pantalla, con la prueba apagada hasta que
// se lo cree: no hay a quién preguntarle todavía.

const CAMPO = `w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] text-ink-primary
  placeholder:text-ink-faint transition-colors duration-150
  focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30`

const VACIO = { name: '', emoji: '🤖', role: '', instructions: '', enabled: true, autoSend: true }

// Los mismos cuatro estados que dibuja Inicio, con los mismos textos: es el
// horario del negocio, no uno de esta pantalla.
const ESTADO_HORARIO = {
  abierto: 'inicio.horarioAtendiendo',
  'antes-de-abrir': 'inicio.horarioNoAbriste',
  'ya-cerro': 'inicio.horarioFuera',
  'no-laborable': 'inicio.horarioNoLaborable',
}

// El idioma en el que contesta la IA. La clave del setting es de dos letras y el
// texto vive en Configuración, que es donde se elige.
const CLAVE_IDIOMA_IA = {
  auto: 'config.idiomaIAAuto',
  es: 'config.idiomaIAEspanol',
  en: 'config.idiomaIAIngles',
  pt: 'config.idiomaIAPortugues',
}

// Lo que el agente hace de verdad, sacado de su estado y no de una lista de
// promesas: las cuatro primeras las hace siempre —son el pipeline—, y las dos
// últimas dependen de cómo esté configurado. Es el equivalente honesto de las
// "acciones" que otros CRM listan en esta pantalla; escribir acá algo que el
// producto no hace es la forma más rápida de que nadie vuelva a creerle a la
// pantalla.
function accionesDe(agent, fuentesActivas) {
  const acciones = [
    { clave: 'accionRutea', Icono: IconSparkles },
    { clave: 'accionCatalogo', Icono: IconBox },
    { clave: 'accionHorario', Icono: IconClock },
    { clave: 'accionMarca', Icono: IconNote },
  ]
  acciones.push(
    agent.autoSend
      ? { clave: 'accionEnvia', Icono: IconBolt }
      : { clave: 'accionBorrador', Icono: IconNote },
  )
  if (fuentesActivas > 0) acciones.push({ clave: 'accionMaterial', Icono: IconFile })
  return acciones
}

function Chip({ Icono, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-tint/[0.08] bg-tint/[0.03] px-2 py-1 text-[11.5px] text-ink-secondary">
      <Icono size={12} className="shrink-0 text-ink-faint" />
      {children}
    </span>
  )
}

function Dato({ label, value, tone = 'text-ink-primary' }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11.5px] text-ink-muted">{label}</p>
      <p className={`text-[17px] font-semibold leading-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

// Una fila de la pestaña "Con qué contesta". Todo lo que se lista acá viaja en
// cada respuesta, así que cada fila lleva adónde se cambia: si el agente
// contesta mal un precio, el problema no está en el agente.
function FilaContexto({ label, value, onIr, irLabel }) {
  const t = useT()
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[12px] text-ink-muted">{label}</p>
        <p className="truncate text-[13px] text-ink-primary">{value}</p>
      </div>
      {onIr && (
        <button
          type="button"
          onClick={onIr}
          className="flex shrink-0 items-center gap-0.5 text-[12px] text-violet transition-colors duration-150 hover:text-ink-primary"
        >
          {irLabel ?? t('agentes.contextoIrA')}
          <IconChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

export default function AgentDetail({
  agent = null,
  stats,
  settings,
  productCount = 0,
  // Si este es el que contesta cuando ninguno encaja, y cómo se llama el que lo
  // hace si no es este. Sale de la lista, que es quien conoce el orden.
  esPorDefecto = false,
  nombrePorDefecto = null,
  onHacerPorDefecto,
  onGuardar,
  onCrear,
  onBorrar,
  onVolver,
  onNavigate,
}) {
  const t = useT()
  const esNuevo = !agent
  const [draft, setDraft] = useState(agent ?? VACIO)
  const [emojis, setEmojis] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const emojiRef = useRef(null)

  const conocimiento = useAgentKnowledge(agent?.id ?? null)
  const fuentesActivas = conocimiento.fuentes.filter((f) => f.enabled).length

  // Lo que llega del server pisa el borrador solo cuando de verdad cambió del
  // otro lado (otro agente, o el mismo ya guardado): sin la comparación, cada
  // vuelta del poll de estadísticas borraría lo que se está escribiendo.
  const remoto = useRef(agent)
  useEffect(() => {
    if (!agent) return
    if (remoto.current?.id === agent.id && remoto.current?.updatedAt === agent.updatedAt) return
    remoto.current = agent
    setDraft(agent)
  }, [agent])

  useEffect(() => {
    if (!emojis) return
    const alClick = (e) => {
      if (!emojiRef.current?.contains(e.target)) setEmojis(false)
    }
    // En captura, como los desplegables del sitio: el listener del propio botón
    // corre después y volvería a abrirlo.
    document.addEventListener('click', alClick, true)
    return () => document.removeEventListener('click', alClick, true)
  }, [emojis])

  const set = (campo) => (e) => setDraft((prev) => ({ ...prev, [campo]: e.target.value }))

  const sucio =
    esNuevo ||
    ['name', 'emoji', 'role', 'instructions'].some((campo) => (draft[campo] ?? '') !== (agent[campo] ?? ''))

  const puedeGuardar = draft.name.trim().length > 0 && (esNuevo || sucio)

  const guardar = () => {
    if (!puedeGuardar || guardando) return
    setGuardando(true)
    setError(null)
    const accion = esNuevo
      ? onCrear({ ...draft, name: draft.name.trim() })
      : onGuardar(agent.id, { ...draft, name: draft.name.trim() })
    accion.catch((err) => setError(err.message)).finally(() => setGuardando(false))
  }

  // Los interruptores se mandan al tocarlos y no esperan al botón de guardar, el
  // mismo criterio que Configuración: no hay nada a medio escribir que
  // confirmar, y una palanca que se queda donde estaba hasta que apretás otra
  // cosa se lee como que no funcionó.
  const alternar = (campo) => (valor) => {
    setDraft((prev) => ({ ...prev, [campo]: valor }))
    if (esNuevo) return
    onGuardar(agent.id, { [campo]: valor }).catch((err) => {
      setDraft((prev) => ({ ...prev, [campo]: !valor }))
      setError(err.message)
    })
  }

  // El horario se lee igual que en Inicio y en Configuración: mismo cálculo,
  // mismos cuatro estados. Sin settings todavía no hay nada que decir.
  const horario = settings ? storeSchedule(settings) : null
  const diasAbiertos = Object.values(settings?.weeklyHours ?? {}).filter(Boolean).length

  const contexto = (
    <div className="divide-y divide-tint/[0.06]">
      <p className="pb-3 text-[12px] leading-relaxed text-ink-muted">{t('agentes.contextoDesc')}</p>
      <FilaContexto
        label={t('agentes.contextoNegocio')}
        value={settings?.storeName || '—'}
        onIr={() => onNavigate?.('settings')}
      />
      <FilaContexto
        label={t('agentes.contextoHorario')}
        value={t('agentes.contextoDiasAbiertos', {
          n: diasAbiertos || (settings?.daysOpen ?? []).length,
        })}
        onIr={() => onNavigate?.('settings')}
      />
      <FilaContexto
        label={t('agentes.contextoCatalogo')}
        value={t('agentes.contextoProductos', { n: productCount })}
        onIr={() => onNavigate?.('products')}
      />
      <FilaContexto
        label={t('agentes.contextoIdioma')}
        value={t(CLAVE_IDIOMA_IA[settings?.aiLanguage] ?? CLAVE_IDIOMA_IA.es)}
        onIr={() => onNavigate?.('settings')}
      />
      <FilaContexto
        label={t('agentes.contextoMaterial')}
        value={t('agentes.contextoFuentes', { n: fuentesActivas })}
      />
      {horario && (
        <p className="pt-3 text-[11.5px] text-ink-faint">{t(ESTADO_HORARIO[horario.reason])}</p>
      )}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* La barra de la pantalla. Reemplaza al `PageHeader` porque acá el
          título no rotula una sección sino un objeto: adelante va la vuelta y
          contra el borde derecho lo único que se hace desde acá. */}
      <div className="animate-fade-down mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-tint/10 pb-4">
        <button
          type="button"
          onClick={onVolver}
          aria-label={t('agentes.volverALista')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted
            transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
        >
          <IconChevronRight size={16} className="rotate-180" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[19px] font-semibold leading-tight tracking-[-0.015em] text-ink-primary">
            {esNuevo ? t('agentes.nuevoTitulo') : draft.name || agent.name}
          </h1>
          {!esNuevo && (
            <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
              {draft.enabled ? t('agentes.encendido') : t('agentes.apagado')}
              {draft.enabled && !draft.autoSend ? ` · ${t('agentes.dejaBorrador')}` : ''}
            </p>
          )}
        </div>

        {/* Guardar aparece apagado y no desaparece: un botón que se va cuando no
            hay cambios deja la esquina vacía y hace dudar de si se guardó. */}
        {sucio && !esNuevo && (
          <Button variant="ghost" onClick={() => setDraft(agent)}>
            {t('agentes.descartar')}
          </Button>
        )}
        <Button disabled={!puedeGuardar || guardando} onClick={guardar}>
          {esNuevo ? t('agentes.crearAgente') : t('comun.guardar')}
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      {/* Abajo de lg las dos columnas se apilan y la prueba queda arriba de
          todo: en una pantalla angosta es lo que hay que ver primero, y al final
          de la página queda a tres scrolls del campo que se acaba de tocar. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="stagger animate-fade-in min-w-0 space-y-4" style={{ '--stagger-base': '40ms' }}>
          <Card title={t('agentes.identidad')} description={t('agentes.identidadDesc')}>
            <div className="flex items-end gap-2.5">
              {/* El emoji no lleva rótulo: `items-end` lo apoya en la misma
                  base que el campo del nombre, y un rótulo de una palabra
                  arriba de un botón de 38px pesa más que el botón. */}
              <div ref={emojiRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setEmojis((v) => !v)}
                  aria-expanded={emojis}
                  aria-label={t('agentes.campoNombre')}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-tint/[0.12]
                    text-[18px] leading-none transition-colors duration-150 hover:border-tint/25"
                >
                  {draft.emoji || '🤖'}
                </button>
                {emojis && (
                  <EmojiPicker
                    hacia="abajo"
                    anclaje="left-0"
                    onPick={(emoji) => {
                      setDraft((prev) => ({ ...prev, emoji }))
                      setEmojis(false)
                    }}
                    onClose={() => setEmojis(false)}
                  />
                )}
              </div>

              <label className="min-w-0 flex-1">
                <span className={LABEL_CLASS}>{t('agentes.campoNombre')}</span>
                <input
                  type="text"
                  value={draft.name}
                  onChange={set('name')}
                  maxLength={60}
                  placeholder={t('agentes.campoNombrePlaceholder')}
                  className={CAMPO}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className={LABEL_CLASS}>{t('agentes.campoRol')}</span>
              <span className="mb-2 block text-[12px] leading-snug text-ink-muted">
                {t('agentes.campoRolHint')}
              </span>
              <textarea
                rows={3}
                value={draft.role}
                onChange={set('role')}
                placeholder={t('agentes.campoRolPlaceholder')}
                className={`${CAMPO} resize-none leading-relaxed`}
              />
            </label>

            <label className="mt-4 block">
              <span className={LABEL_CLASS}>{t('agentes.campoInstrucciones')}</span>
              <span className="mb-2 block text-[12px] leading-snug text-ink-muted">
                {t('agentes.campoInstruccionesHint')}
              </span>
              <textarea
                rows={4}
                value={draft.instructions}
                onChange={set('instructions')}
                placeholder={t('agentes.campoInstruccionesPlaceholder')}
                className={`${CAMPO} resize-none leading-relaxed`}
              />
            </label>

            <div className="mt-5 border-t border-tint/[0.06] pt-4">
              <p className="mb-2 text-[12px] text-ink-muted">{t('agentes.queHace')}</p>
              <div className="flex flex-wrap gap-1.5">
                {accionesDe(draft, fuentesActivas).map(({ clave, Icono }) => (
                  <Chip key={clave} Icono={Icono}>
                    {t(`agentes.${clave}`)}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          <KnowledgeCard
            fuentes={conocimiento.fuentes}
            cargando={conocimiento.cargando}
            guardando={conocimiento.guardando}
            error={conocimiento.error}
            limpiarError={conocimiento.limpiarError}
            onAgregarArchivo={conocimiento.agregarArchivo}
            onAgregarEnlace={conocimiento.agregarEnlace}
            onAgregarTexto={conocimiento.agregarTexto}
            onAlternar={conocimiento.alternar}
            onBorrar={conocimiento.borrar}
            deshabilitado={esNuevo}
          />

          <Card title={t('agentes.comportamiento')}>
            <div className="space-y-2">
              <Switch
                checked={draft.enabled}
                onChange={alternar('enabled')}
                label={t('agentes.switchEncendido')}
                hint={t('agentes.switchEncendidoHint')}
              />
              <Switch
                checked={draft.autoSend}
                onChange={alternar('autoSend')}
                label={t('agentes.switchAutoSend')}
                hint={t('agentes.switchAutoSendHint')}
              />
            </div>

            {/* El agente por defecto es el primero encendido de la lista, y el
                orden se cambiaba con dos flechitas en cada fila. Acá se dice lo
                que esa posición significa y se la cambia con un botón: nadie
                reordena una lista de agentes por gusto, se hace para que
                conteste otro. */}
            {!esNuevo && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-tint/[0.06] pt-3">
                <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink-muted">
                  {esPorDefecto
                    ? t('agentes.esElPorDefecto')
                    : t('agentes.noEsPorDefecto', { nombre: nombrePorDefecto ?? '—' })}
                </p>
                {!esPorDefecto && onHacerPorDefecto && (
                  <Button size="sm" variant="secondary" onClick={() => onHacerPorDefecto(agent.id)}>
                    {t('agentes.hacerPorDefecto')}
                  </Button>
                )}
              </div>
            )}
          </Card>

          <Card title={t('agentes.consejos')}>
            <ul className="space-y-2.5">
              {['consejoRol', 'consejoMaterial', 'consejoProbar'].map((clave) => (
                <li key={clave} className="flex gap-2.5">
                  <IconCheck size={13} className="mt-[3px] shrink-0 text-ink-faint" />
                  <p className="text-[12.5px] leading-relaxed text-ink-secondary">{t(`agentes.${clave}`)}</p>
                </li>
              ))}
            </ul>
          </Card>

          {!esNuevo && (
            <Card title={t('agentes.rendimiento')} description={t('agentes.rendimientoDesc')}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Dato label={t('agentes.datoConversaciones')} value={stats?.conversations ?? 0} />
                <Dato label={t('agentes.datoMensajes')} value={stats?.handled ?? 0} />
                <Dato label={t('agentes.datoContestoSolo')} value={stats?.automatic ?? 0} />
                <Dato
                  label={t('agentes.datoParaRevisar')}
                  value={stats?.pending ?? 0}
                  tone={(stats?.pending ?? 0) > 0 ? 'text-status-warning' : 'text-ink-muted'}
                />
              </div>

              {/* Borrar vive al final y como ícono, no como botón rojo: el rojo
                  pleno se guarda para el que confirma adentro del modal. */}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-tint/[0.06] pt-3">
                <p className="text-[12px] text-ink-muted">{t('agentes.borrarDetalle')}</p>
                <Button variant="ghost" onClick={() => setConfirmarBorrado(true)}>
                  <IconTrash size={14} />
                  {t('comun.borrar')}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* La prueba se queda a la vista mientras la columna de la izquierda
            scrollea. El alto sale de la ventana menos la barra de título y el
            aire del layout, para que el hilo scrollee adentro y no empuje la
            página.

            **El alto es fijo y no depende del contenido.** Sin esto la tarjeta
            medía lo que midiera el hilo: arrancaba chiquita con el vacío, se
            estiraba con el primer mensaje y volvía a saltar con cada respuesta,
            así que el cuadro de escribir cambiaba de lugar entre que se manda
            un mensaje y llega la respuesta. Abajo de `lg` no puede ser el alto
            de la ventana —está apilada arriba de la configuración— así que
            lleva uno propio, pero fijo igual. */}
        <div className="h-[34rem] lg:sticky lg:top-0 lg:h-[calc(100dvh-var(--barra-titulo)-8.5rem)] lg:min-h-[38rem]">
          <AgentTester
            agentId={agent?.id ?? null}
            agentEmoji={draft.emoji}
            sinGuardar={esNuevo}
            contexto={contexto}
          />
        </div>
      </div>

      {confirmarBorrado && (
        <Modal title={t('agentes.borrarAgente')} onClose={() => setConfirmarBorrado(false)}>
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('agentes.seVaABorrar')} <span className="text-ink-primary">{agent.name}</span>.{' '}
            {t('agentes.borrarDetalle')}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmarBorrado(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onBorrar(agent.id)
                  .then(onVolver)
                  .catch((err) => {
                    setConfirmarBorrado(false)
                    setError(err.message)
                  })
              }}
            >
              {t('agentes.borrarAgente')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
