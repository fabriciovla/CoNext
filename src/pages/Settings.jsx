import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import { IconCheck, IconChevronDown, IconClock, IconSparkles } from '../components/ui/icons'
import WhatsappConnection from '../components/WhatsappConnection'
import MetaConnection from '../components/MetaConnection'
import { weekDays } from '../data/mockData'
import { storeSchedule } from '../utils/metrics'

// Configuración no es un formulario: es una lista de cosas que ya están puestas
// y que se pueden tocar. Por eso no hay botón de "Guardar" ni campos con caja —
// cada cambio se manda solo (los días al hacer click, el texto al salir del
// campo) y el aviso de abajo confirma que se guardó. El nombre de la tienda y el
// número de WhatsApp salieron: los dos los da la conexión con Meta, y tenerlos
// también acá era pedir que se escriban a mano datos que ya sabemos.

// Los únicos campos que esta página edita. Se usan para no mandar un PUT cuando
// se entró y se salió de un campo sin tocar nada.
const CAMPOS = ['welcomeMessage', 'awayMessage']

function horariosDe(settings) {
  const guardados = settings.weeklyHours ?? {}
  if (Object.keys(guardados).length > 0) {
    return Object.fromEntries(weekDays.map((day) => [day, guardados[day] ?? null]))
  }

  const abiertos = new Set(settings.daysOpen ?? [])
  return Object.fromEntries(
    weekDays.map((day) => [
      day,
      abiertos.has(day)
        ? {
            openTime: settings.openTime || '09:00',
            closeTime: settings.closeTime || '18:00',
          }
        : null,
    ]),
  )
}

function sinCambios(a, b) {
  return (
    CAMPOS.every((campo) => (a[campo] ?? '') === (b[campo] ?? '')) &&
    JSON.stringify(horariosDe(a)) === JSON.stringify(horariosDe(b))
  )
}

const ESTADO_HORARIO = {
  abierto: 'Atendiendo ahora',
  'antes-de-abrir': 'Abre más tarde',
  'ya-cerro': 'Fuera de horario',
  'no-laborable': 'Hoy no se atiende',
}

// La clave que se guarda sigue siendo `Lun`/`Mar`: es la misma que usa el
// server y `businessHours`. Acá solo cambia lo que se lee en pantalla.
const NOMBRES_DIA = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mié: 'Miércoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
  Sáb: 'Sábado',
  Dom: 'Domingo',
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS = ['00', '15', '30', '45']

function partesDe(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  if (!m) return { hh: '09', mm: '00' }
  return { hh: m[1].padStart(2, '0'), mm: m[2] }
}

// Selector propio: el `input type="time"` lo dibuja el sistema y no hay forma
// de vestirlo. Acá la hora se elige en una grilla (las 24) y los minutos en
// cuartos: se ve entero, sin el reloj nativo ni un desplegable de 96 filas.
function TimePicker({ value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const { hh, mm } = partesDe(value)
  const minutos = MINUTOS.includes(mm) ? MINUTOS : [...MINUTOS, mm].sort()

  const abrir = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const alto = 248
    const ancho = 280
    const haciaArriba = rect.bottom + alto > window.innerHeight - 8
    const left = Math.min(rect.left, window.innerWidth - ancho - 8)
    setPos(
      haciaArriba
        ? { left, bottom: window.innerHeight - rect.top + 6 }
        : { left, top: rect.bottom + 6 },
    )
    setOpen(true)
  }

  const cerrar = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        cerrar()
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? cerrar() : abrir())}
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium tabular-nums
          transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet/30
          ${
            open
              ? 'border-violet/60 bg-violet-soft text-violet'
              : 'border-tint/[0.1] bg-tint/[0.03] text-ink-primary hover:border-tint/25'
          }`}
      >
        {hh}:{mm}
        <IconChevronDown
          size={12}
          className={`text-ink-faint transition-transform duration-200 ${open ? 'rotate-180 text-violet' : ''}`}
        />
      </button>

      {open && pos && (
        <>
          {/* Fijo al viewport: la tarjeta recorta con overflow-hidden, y un
              `absolute` nacería cortado por el borde redondeado. */}
          <div className="fixed inset-0 z-20" onClick={cerrar} />
          <div
            role="dialog"
            aria-label={ariaLabel}
            className="animate-scale-in fixed z-30 w-[17.5rem] rounded-xl border border-tint/10 bg-surface-raised p-2.5 shadow-pop"
            style={pos}
          >
            <div className="grid grid-cols-6 gap-0.5">
              {HORAS.map((h) => {
                const activa = h === hh
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(`${h}:${mm}`)}
                    className={`h-8 rounded-md text-[12.5px] tabular-nums transition-colors duration-100
                      ${
                        activa
                          ? 'bg-violet-soft font-medium text-violet'
                          : 'text-ink-secondary hover:bg-tint/[0.06] hover:text-ink-primary'
                      }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-0.5">
              {minutos.map((m) => {
                const activa = m === mm
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onChange(`${hh}:${m}`)
                      setOpen(false)
                    }}
                    className={`h-8 rounded-md text-[12.5px] tabular-nums transition-colors duration-100
                      ${
                        activa
                          ? 'bg-violet-soft font-medium text-violet'
                          : 'text-ink-secondary hover:bg-tint/[0.06] hover:text-ink-primary'
                      }`}
                  >
                    :{m}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FilaDia({ day, horario, onToggle, onEditarHora, className = '' }) {
  const nombre = NOMBRES_DIA[day]
  return (
    <div className={`flex min-h-12 items-center justify-center gap-2.5 py-2 ${className}`}>
      {horario ? (
        <>
          <p className="w-[6.75rem] shrink-0 text-[13px] font-medium text-ink-primary">{nombre}</p>
          <TimePicker
            value={horario.openTime}
            ariaLabel={`Hora de apertura del ${nombre}`}
            onChange={(value) => onEditarHora('openTime', value)}
          />
          <span className="text-[12px] text-ink-faint">a</span>
          <TimePicker
            value={horario.closeTime}
            ariaLabel={`Hora de cierre del ${nombre}`}
            onChange={(value) => onEditarHora('closeTime', value)}
          />
          <button
            type="button"
            onClick={onToggle}
            className="text-[12px] text-ink-faint transition-colors duration-150 hover:text-ink-primary
              focus-visible:outline-none focus-visible:text-ink-primary"
          >
            Cerrar
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:text-ink-primary"
        >
          <span className="w-[6.75rem] shrink-0 text-[13px] text-ink-muted">{nombre}</span>
          <span className="text-[13px] text-ink-faint transition-colors duration-150 hover:text-ink-primary">
            Cerrado
          </span>
        </button>
      )}
    </div>
  )
}

// Encabezado en banda, como las tarjetas de Agentes: el riel de al lado
// estiraba la columna del título a la altura del contenido y dejaba un
// rectángulo vacío. Acá el encabezado mide lo que dice, y el cuerpo usa el
// ancho entero.
function Seccion({ icon, title, description, meta, children, className = '' }) {
  return (
    <Card className={`min-w-0 overflow-hidden ${className}`} bodyClassName="p-0">
      <div className="flex items-start gap-3 border-b border-tint/[0.06] bg-tint/[0.02] px-5 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold text-ink-primary">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{description}</p>
        </div>
        {meta && <div className="shrink-0 pt-0.5 text-right">{meta}</div>}
      </div>
      {children}
    </Card>
  )
}

function CampoMensaje({ label, hint, placeholder, rows, value, onChange, onBlur }) {
  return (
    <label className="block min-w-0">
      <span className="text-[13px] font-medium text-ink-primary">{label}</span>
      <textarea
        rows={rows}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`mt-1.5 ${CAMPO_TEXTO}`}
      />
      <span className="mt-1.5 flex items-start justify-between gap-3">
        <span className="text-[12px] leading-relaxed text-ink-muted">{hint}</span>
        <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">{value.length}</span>
      </span>
    </label>
  )
}

// Ni el reloj ni los mensajes llevan borde hasta que se los toca: en reposo se
// leen como el dato que son, y la caja aparece cuando hay algo que editar.
// El fondo lo pone cada campo (y no esta base) porque dos clases `bg-` en el
// mismo elemento las resuelve el orden de la hoja de Tailwind, no el del string.
const CAMPO_BASE = `rounded-lg border border-transparent text-[13px] text-ink-primary
  placeholder:text-ink-faint transition-colors duration-150 hover:border-tint/[0.12]
  focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30`

// Los mensajes sí llevan un fondo apenas marcado. Sin él, un campo largo y
// vacío es un hueco: no se ve dónde termina ni que se puede escribir ahí.
const CAMPO_TEXTO = `${CAMPO_BASE} w-full resize-none bg-tint/[0.03] px-3 py-2 leading-relaxed`

export default function Settings({ settings, onUpdate }) {
  const [draft, setDraft] = useState(settings)
  const [guardado, setGuardado] = useState(false)
  // Hay una edición sin confirmar: mientras esté prendido, lo que llega del
  // server no pisa lo que se está escribiendo.
  const editando = useRef(false)
  const avisoTimer = useRef(null)

  // `settings` arranca vacío y se completa cuando responde GET /settings. Sin
  // esto, entrar a Configuración antes de que cargue dejaba el borrador en
  // blanco y el primer guardado escribía ese blanco encima de todo.
  useEffect(() => {
    if (!editando.current) setDraft(settings)
  }, [settings])

  useEffect(() => () => clearTimeout(avisoTimer.current), [])

  const editar = (changes) => {
    editando.current = true
    setDraft((prev) => ({ ...prev, ...changes }))
  }

  const guardar = (changes = {}) => {
    const next = { ...draft, ...changes }
    editando.current = false
    if (sinCambios(next, settings)) return
    setDraft(next)
    onUpdate(next)
    setGuardado(true)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setGuardado(false), 2400)
  }

  const toggleDay = (day) => {
    const horarios = horariosDe(draft)
    guardar({
      weeklyHours: {
        ...horarios,
        [day]: horarios[day]
          ? null
          : {
              openTime: draft.openTime || '09:00',
              closeTime: draft.closeTime || '18:00',
            },
      },
    })
  }

  const editarHora = (day, field, value) => {
    const horarios = horariosDe(draft)
    guardar({
      weeklyHours: {
        ...horarios,
        [day]: { ...horarios[day], [field]: value },
      },
    })
  }

  const horarios = horariosDe(draft)
  const diasConfigurados = weekDays.filter((day) => horarios[day]).length
  const estadoHorario =
    diasConfigurados > 0 ? storeSchedule({ ...draft, weeklyHours: horarios }) : null

  return (
    // El techo de ancho envuelve también al encabezado y no solo a las
    // tarjetas: son formularios, así que la columna es más angosta que el resto
    // de la app, y con el techo puesto solo abajo el aviso de guardado quedaba
    // flotando 200px a la derecha de la última tarjeta.
    <div className="stagger max-w-5xl" style={{ '--stagger-base': '60ms' }}>
      {/* El aviso de guardado va donde iría la acción de la sección: acá no hay
          botón de guardar —los cambios se mandan solos— y el hueco de la
          derecha es justo donde se busca la confirmación de que se mandaron.
          La altura fija es para que el encabezado no cambie de alto cuando el
          texto pasa de "se guardan solos" a "cambios guardados". */}
      <PageHeader
        title="Configuración"
        description="El canal por el que entran los mensajes, el horario del negocio y cómo responde la IA."
        actions={
          <p className="flex h-8 items-center gap-1.5 text-[12px] text-ink-muted">
            {guardado ? (
              <span className="animate-pop-in flex items-center gap-1.5 font-medium text-status-good">
                <IconCheck size={13} />
                Cambios guardados
              </span>
            ) : (
              'Los cambios se guardan solos.'
            )}
          </p>
        }
      />

      <div className="space-y-3">
        {/* Los canales van en grilla y no apilados uno encima del otro: son un
            catálogo de servicios que se enganchan, no dos secciones más del
            formulario. Puestos al lado, lo que se compara de un vistazo es cuál
            está conectado y cuál no, que es la única pregunta que traen.

            `items-stretch` es el que las deja a la par: las dos miden lo mismo
            aunque una diga más que la otra, y la fila de acciones de cada una
            queda apoyada abajo, en la misma línea. */}
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
          <WhatsappConnection />
          <MetaConnection />
        </div>

        <Seccion
            icon={<IconClock size={16} />}
            title="Horario de atención"
            description="Define cuándo puede responder la IA y cuándo se envía el aviso de ausencia."
            meta={
              <span
                className={`flex items-center justify-end gap-1.5 text-[12px] font-medium ${
                  estadoHorario?.isOpen ? 'text-status-good' : 'text-ink-secondary'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    estadoHorario?.isOpen ? 'bg-status-good' : 'bg-tint/30'
                  }`}
                />
                {estadoHorario ? ESTADO_HORARIO[estadoHorario.reason] : 'Sin horario'}
              </span>
            }
          >
            <div className="p-5">
              <div className="grid grid-cols-1 border-t border-tint/[0.06] sm:grid-cols-2 sm:gap-x-8">
                {weekDays.slice(0, 6).map((day) => (
                  <FilaDia
                    key={day}
                    day={day}
                    horario={horarios[day]}
                    onToggle={() => toggleDay(day)}
                    onEditarHora={(field, value) => editarHora(day, field, value)}
                    className="border-b border-tint/[0.06]"
                  />
                ))}
                {/* Domingo abajo, a caballo de las dos columnas. */}
                <FilaDia
                  day="Dom"
                  horario={horarios.Dom}
                  onToggle={() => toggleDay('Dom')}
                  onEditarHora={(field, value) => editarHora('Dom', field, value)}
                  className="border-b border-tint/[0.06] sm:col-span-2"
                />
              </div>
              <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-muted">
                {estadoHorario
                  ? `${diasConfigurados} día${diasConfigurados === 1 ? '' : 's'} configurado${
                      diasConfigurados === 1 ? '' : 's'
                    }. Cada uno puede tener su propio horario.`
                  : 'Activá al menos un día para que la IA sepa cuándo puede responder automáticamente.'}
              </p>
            </div>
          </Seccion>

          <Seccion
            icon={<IconSparkles size={16} />}
            title="Respuestas automáticas"
            description="Ajusta cómo habla la IA y qué recibe quien escribe cuando el negocio está cerrado."
          >
            <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <CampoMensaje
                label="Tono de la casa"
                hint="Es el ejemplo con el que la IA aprende cómo habla tu negocio. No se envía como mensaje."
                rows={4}
                placeholder="¡Hola! Gracias por escribirnos 😊 ¿En qué te podemos ayudar?"
                value={draft.welcomeMessage ?? ''}
                onChange={(e) => editar({ welcomeMessage: e.target.value })}
                onBlur={() => guardar()}
              />

              <CampoMensaje
                label="Mensaje fuera de horario"
                hint="Se envía como máximo una vez cada 12 h. Si queda vacío, no se manda ningún aviso."
                rows={4}
                placeholder="Ahora no estamos atendiendo. Te respondemos apenas abrimos."
                value={draft.awayMessage ?? ''}
                onChange={(e) => editar({ awayMessage: e.target.value })}
                onBlur={() => guardar()}
              />
            </div>
          </Seccion>
      </div>
    </div>
  )
}
