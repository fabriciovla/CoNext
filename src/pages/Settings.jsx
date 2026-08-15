import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { IconCheck } from '../components/ui/icons'
import WhatsappConnection from '../components/WhatsappConnection'
import { weekDays } from '../data/mockData'

// Configuración no es un formulario: es una lista de cosas que ya están puestas
// y que se pueden tocar. Por eso no hay botón de "Guardar" ni campos con caja —
// cada cambio se manda solo (los días al hacer click, el texto al salir del
// campo) y el aviso de abajo confirma que se guardó. El nombre de la tienda y el
// número de WhatsApp salieron: los dos los da la conexión con Meta, y tenerlos
// también acá era pedir que se escriban a mano datos que ya sabemos.

// Los únicos campos que esta página edita. Se usan para no mandar un PUT cuando
// se entró y se salió de un campo sin tocar nada.
const CAMPOS = ['openTime', 'closeTime', 'welcomeMessage', 'awayMessage']

function sinCambios(a, b) {
  const diasA = a.daysOpen ?? []
  const diasB = b.daysOpen ?? []
  return (
    CAMPOS.every((campo) => (a[campo] ?? '') === (b[campo] ?? '')) &&
    diasA.length === diasB.length &&
    diasA.every((dia) => diasB.includes(dia))
  )
}

function Seccion({ title, children }) {
  return (
    <section className="mx-auto max-w-xl">
      <h2 className="mb-1.5 px-1 text-[12px] text-ink-muted">{title}</h2>
      <div className="divide-y divide-tint/[0.06] rounded-xl border border-tint/[0.08] bg-surface-card px-5 shadow-card">
        {children}
      </div>
    </section>
  )
}

// Fila de ajuste: a la izquierda qué es, a la derecha el control. `stacked` es
// para los que no entran al lado del rótulo (los mensajes largos) y bajan a la
// línea de abajo.
function Fila({ label, hint, stacked = false, children }) {
  return (
    <div className={stacked ? 'py-4' : 'flex items-start justify-between gap-6 py-4'}>
      <div className="min-w-0">
        <p className="text-[13px] text-ink-primary">{label}</p>
        {hint && <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{hint}</p>}
      </div>
      <div className={stacked ? 'mt-2.5' : 'shrink-0'}>{children}</div>
    </div>
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
const CAMPO_HORA = `${CAMPO_BASE} bg-transparent px-2 py-1 tabular-nums`

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
    const dias = draft.daysOpen ?? []
    guardar({
      daysOpen: dias.includes(day) ? dias.filter((d) => d !== day) : [...dias, day],
    })
  }

  return (
    <div className="stagger space-y-5" style={{ '--stagger-base': '60ms' }}>
      <PageHeader title="Configuración" />

      <WhatsappConnection />

      <Seccion title="Atención">
        <Fila label="Horario">
          <div className="flex items-center gap-1">
            <input
              type="time"
              aria-label="Hora de apertura"
              value={draft.openTime ?? ''}
              onChange={(e) => editar({ openTime: e.target.value })}
              onBlur={() => guardar()}
              className={CAMPO_HORA}
            />
            <span className="text-[12px] text-ink-faint">a</span>
            <input
              type="time"
              aria-label="Hora de cierre"
              value={draft.closeTime ?? ''}
              onChange={(e) => editar({ closeTime: e.target.value })}
              onBlur={() => guardar()}
              className={CAMPO_HORA}
            />
          </div>
        </Fila>

        <Fila label="Días abiertos">
          <div className="flex flex-wrap justify-end gap-1.5">
            {weekDays.map((day) => {
              const activo = (draft.daysOpen ?? []).includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={activo}
                  className={`h-8 w-10 rounded-lg border text-[12px] font-medium transition-colors duration-150 ${
                    activo
                      ? 'border-violet/60 bg-violet-soft text-violet'
                      : 'border-tint/[0.1] text-ink-muted hover:border-tint/25 hover:text-ink-primary'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </Fila>
      </Seccion>

      <Seccion title="Lo que responde el bot">
        <Fila
          stacked
          label="Tono de la casa"
          // El nombre viejo ("Mensaje de bienvenida") prometía algo que no pasa:
          // este texto no se envía nunca. Va al prompt como ejemplo de cómo
          // habla el negocio, y de ahí sale el tono de todas las respuestas.
          hint="No se envía: es el ejemplo con el que la IA aprende cómo habla tu negocio."
        >
          <textarea
            rows={3}
            aria-label="Tono de la casa"
            placeholder="¡Hola! Gracias por escribirnos 😊 ¿En qué te podemos ayudar?"
            value={draft.welcomeMessage ?? ''}
            onChange={(e) => editar({ welcomeMessage: e.target.value })}
            onBlur={() => guardar()}
            className={CAMPO_TEXTO}
          />
        </Fila>

        <Fila
          stacked
          label="Fuera de horario"
          hint="Se envía tal cual cuando escriben fuera de horario, una vez cada 12 h. En ese rato el bot no responde solo: deja borrador. Vacío = no se manda nada."
        >
          <textarea
            rows={2}
            aria-label="Mensaje fuera de horario"
            placeholder="Ahora no estamos atendiendo. Te respondemos apenas abrimos."
            value={draft.awayMessage ?? ''}
            onChange={(e) => editar({ awayMessage: e.target.value })}
            onBlur={() => guardar()}
            className={CAMPO_TEXTO}
          />
        </Fila>
      </Seccion>

      {/* Sin botón de guardar, hay que decir que se guarda solo — si no, se
          busca uno. El aviso ocupa el mismo lugar prendido o apagado, para que
          la página no salte cuando aparece. */}
      <p className="flex h-5 items-center justify-center gap-1.5 text-[12px] text-ink-muted">
        {guardado ? (
          <span className="animate-pop-in flex items-center gap-1.5 font-medium text-status-good">
            <IconCheck size={13} />
            Cambios guardados
          </span>
        ) : (
          'Los cambios se guardan solos.'
        )}
      </p>
    </div>
  )
}
