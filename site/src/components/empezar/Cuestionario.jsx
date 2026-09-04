import { useEffect, useId, useRef, useState } from 'react'
import { LogoMarca } from '../Logo.jsx'
import Boton from '../Boton.jsx'
import { IconCheck } from '../icons.jsx'
import { ALTA_CLAVE } from '../../config'

// Post-compra: una pregunta por pantalla, sin scroll de página. Arranca en
// la primera (no hay splash). Las opciones avanzan solas; "Otro" y el
// nombre piden Continuar. Si ya contestó, /empezar lo manda a la app.

const LETRAS = 'ABCDEFGH'
const CAMPO =
  'w-full rounded-xl border border-tint/[0.12] bg-transparent px-3.5 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-faint transition-colors duration-150 focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30'

export default function Cuestionario({ copy, plan, correo = '', appUrl, apiUrl }) {
  const pasos = copy.pasos
  const total = pasos.length
  const preguntaId = useId()
  const otroRef = useRef(null)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [respuestas, setRespuestas] = useState({})
  const [bloqueado, setBloqueado] = useState(false)
  const avanzarTimer = useRef(0)

  const enListo = i >= total
  const paso = !enListo ? pasos[i] : null
  const progreso = enListo ? 1 : (i + 1) / total

  const ir = (destino) => {
    window.clearTimeout(avanzarTimer.current)
    setBloqueado(false)
    const next = Math.min(total, Math.max(0, destino))
    setDir(next > i ? 1 : -1)
    setI(next)
  }

  const setValor = (clave, valor) => {
    setRespuestas((prev) => ({ ...prev, [clave]: valor }))
  }

  const elegirOpcion = (opcion) => {
    if (!paso || bloqueado) return
    const yaEra = respuestas[paso.id] === opcion.id
    setValor(paso.id, opcion.id)
    if (opcion.otro) {
      window.setTimeout(() => otroRef.current?.focus(), 40)
      return
    }
    if (yaEra) {
      ir(i + 1)
      return
    }
    setBloqueado(true)
    avanzarTimer.current = window.setTimeout(() => {
      setBloqueado(false)
      ir(i + 1)
    }, 380)
  }

  const otroListo = (pasoActual) => {
    const opcion = pasoActual.opciones.find((o) => o.id === respuestas[pasoActual.id])
    if (!opcion?.otro) return true
    return Boolean(String(respuestas[`${pasoActual.id}Otro`] ?? '').trim())
  }

  const camposListos = (pasoActual) =>
    pasoActual.campos.every((c) => String(respuestas[c.id] ?? '').trim())

  const puedeSeguir = () => {
    if (!paso) return false
    if (paso.tipo === 'opciones') return Boolean(respuestas[paso.id]) && otroListo(paso)
    if (paso.tipo === 'campos') return camposListos(paso)
    return false
  }

  const intentarSeguir = () => {
    if (enListo || !puedeSeguir()) return
    ir(i + 1)
  }

  useEffect(() => {
    if (!enListo) return
    let cancelado = false

    const registrar = async () => {
      const empezó = Date.now()
      try {
        if (apiUrl) {
          await fetch(`${apiUrl}/altas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, correo, respuestas }),
          })
        }
      } catch {
        /* si el server no responde, igual entra: el skip de este navegador
           vive en localStorage; el registro en la base se puede rehacer */
      }
      try {
        localStorage.setItem(
          ALTA_CLAVE,
          JSON.stringify({ listo: true, plan, correo, respuestas, at: Date.now() }),
        )
      } catch {
        /* private mode */
      }
      const espera = Math.max(0, 1100 - (Date.now() - empezó))
      await new Promise((r) => setTimeout(r, espera))
      if (cancelado) return
      // El correo viaja también a la app. Quien llegó acá desde el login ya se
      // identificó una vez: sin esto termina el cuestionario y se encuentra con
      // el formulario de ingreso otra vez, que es la misma puerta dos veces.
      const url = new URL(appUrl || '/', window.location.origin)
      url.searchParams.set('plan', plan)
      if (correo) url.searchParams.set('u', correo.split('@')[0])
      // `toString()` y no `pathname + search`: en desarrollo APP_URL es otro
      // origen (el Vite del puerto 5173) y quedarse con el path mandaría a
      // /app del propio sitio, que no existe.
      window.location.assign(url.toString())
    }

    registrar()
    return () => {
      cancelado = true
    }
  }, [enListo, apiUrl, appUrl, plan, correo, respuestas])

  useEffect(() => {
    const onTecla = (evento) => {
      if (enListo) return
      const tag = evento.target?.tagName
      const enCampo = tag === 'INPUT' || tag === 'TEXTAREA'

      if ((evento.key === 'Escape' || (evento.key === 'Backspace' && !enCampo)) && i > 0) {
        evento.preventDefault()
        ir(i - 1)
        return
      }

      if (evento.key === 'Enter' && !evento.shiftKey) {
        if (!puedeSeguir()) return
        evento.preventDefault()
        intentarSeguir()
        return
      }

      if (enCampo || !paso || paso.tipo !== 'opciones' || bloqueado) return
      const idx = LETRAS.indexOf(evento.key.toUpperCase())
      if (idx >= 0 && paso.opciones[idx]) {
        evento.preventDefault()
        elegirOpcion(paso.opciones[idx])
      }
    }
    window.addEventListener('keydown', onTecla)
    return () => window.removeEventListener('keydown', onTecla)
  })

  useEffect(() => () => window.clearTimeout(avanzarTimer.current), [])

  const mostrarContinuar =
    !enListo &&
    (paso?.tipo === 'campos' || (paso?.tipo === 'opciones' && respuestas[paso.id] && !bloqueado))

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="empezar-progreso" aria-hidden="true">
        <span style={{ transform: `scaleX(${progreso})` }}></span>
      </div>

      <header className="relative z-10 flex h-12 shrink-0 items-center justify-center px-5 sm:px-8">
        <ol className="flex list-none items-center gap-1.5 p-0" aria-label={copy.progreso.replace('{n}', String(Math.min(i + 1, total))).replace('{total}', String(total))}>
          {pasos.map((p, n) => (
            <li
              key={p.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === i && !enListo ? 'w-5 bg-violet' : n < i || enListo ? 'w-1.5 bg-violet' : 'w-1.5 bg-tint/20'
              }`}
            />
          ))}
        </ol>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-5 sm:px-8">
        <div className="mx-auto flex min-h-0 w-full max-w-[34rem] flex-1 flex-col items-center justify-center py-4">
          {!enListo && (
            <div className="mb-6 inline-flex w-fit text-violet">
              <LogoMarca className="h-11 w-auto sm:h-12" />
            </div>
          )}
          <div key={`${i}-${dir}`} className={`w-full ${dir >= 0 ? 'paso-in-adelante' : 'paso-in-atras'}`}>
            {paso?.tipo === 'opciones' && (
              <Opciones
                paso={paso}
                preguntaId={preguntaId}
                elegido={respuestas[paso.id]}
                otroValor={respuestas[`${paso.id}Otro`] ?? ''}
                otroRef={otroRef}
                otroPh={copy.otroPh}
                onElegir={elegirOpcion}
                onOtro={(valor) => setValor(`${paso.id}Otro`, valor)}
              />
            )}
            {paso?.tipo === 'campos' && (
              <Campos
                paso={paso}
                preguntaId={preguntaId}
                valores={respuestas}
                onChange={setValor}
                onSubmit={intentarSeguir}
              />
            )}
            {enListo && <Listo copy={copy} />}
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
        {i > 0 && !enListo ? (
          <button
            type="button"
            onClick={() => ir(i - 1)}
            className="rounded-lg px-1 py-2 text-[14px] text-ink-muted transition-colors duration-150 hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {copy.atras}
          </button>
        ) : (
          <span />
        )}
        {mostrarContinuar && (
          <Boton
            as="button"
            type="button"
            onClick={intentarSeguir}
            disabled={!puedeSeguir()}
            className="disabled:pointer-events-none disabled:opacity-40"
          >
            {copy.continuar}
            <kbd className="hidden rounded-md bg-ink-inverted/15 px-1.5 py-0.5 text-[11px] font-medium sm:inline">
              {copy.enter}
            </kbd>
          </Boton>
        )}
      </footer>
    </div>
  )
}

function Opciones({ paso, preguntaId, elegido, otroValor, otroRef, otroPh, onElegir, onOtro }) {
  const opcionElegida = paso.opciones.find((o) => o.id === elegido)

  return (
    <div>
      <h1
        id={preguntaId}
        className="text-center text-balance text-[28px] font-medium leading-[1.15] tracking-tight text-ink-primary sm:text-[34px]"
      >
        {paso.pregunta}
      </h1>
      <div role="radiogroup" aria-labelledby={preguntaId} className="mt-7 grid gap-2">
          {paso.opciones.map((opcion, idx) => {
            const activa = elegido === opcion.id
            return (
              <button
                key={opcion.id}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => onElegir(opcion)}
                style={{ '--i': idx }}
                className={`empezar-opcion group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet ${
                  activa
                    ? 'border-violet/35 bg-violet/[0.055]'
                    : 'border-tint/[0.12] bg-surface-card hover:border-tint/25 hover:bg-surface-hover'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-medium ${
                    activa
                      ? 'bg-violet text-ink-inverted'
                      : 'border border-tint/15 text-ink-muted group-hover:border-tint/30 group-hover:text-ink-secondary'
                  }`}
                >
                  {activa ? <IconCheck size={13} /> : LETRAS[idx]}
                </span>
                <span className="min-w-0 flex-1 text-[14.5px] font-medium text-ink-primary">{opcion.label}</span>
              </button>
            )
          })}
        </div>
        {opcionElegida?.otro && (
          <label className="animate-in mt-3 block" style={{ '--d': '40ms' }}>
            <span className="sr-only">{otroPh}</span>
            <input
              ref={otroRef}
              value={otroValor}
              onChange={(e) => onOtro(e.target.value)}
              placeholder={otroPh}
              className={CAMPO}
            />
          </label>
        )}
    </div>
  )
}

function Campos({ paso, preguntaId, valores, onChange, onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <h1
        id={preguntaId}
        className="text-center text-balance text-[28px] font-medium leading-[1.15] tracking-tight text-ink-primary sm:text-[34px]"
      >
        {paso.pregunta}
      </h1>
      <div className="mt-7 space-y-4">
        {paso.campos.map((campo, idx) => (
          <label key={campo.id} className="block">
            <span className="mb-1.5 block text-[13px] text-ink-secondary">{campo.label}</span>
            <input
              name={campo.id}
              value={valores[campo.id] ?? ''}
              onChange={(e) => onChange(campo.id, e.target.value)}
              placeholder={campo.ph}
              autoComplete={campo.auto}
              autoFocus={idx === 0}
              required
              style={{ '--i': idx }}
              className={`${CAMPO} empezar-opcion`}
            />
          </label>
        ))}
      </div>
    </form>
  )
}

function Listo({ copy }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="animate-in-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet text-ink-inverted">
        <IconCheck size={28} />
      </div>
      <h1
        className="animate-in mt-6 text-[28px] font-medium tracking-tight text-ink-primary sm:text-[32px]"
        style={{ '--d': '80ms' }}
      >
        {copy.listoTitulo}
      </h1>
      <p className="animate-in mt-3 text-[15px] text-ink-secondary" style={{ '--d': '160ms' }}>
        {copy.listoBajada}
      </p>
    </div>
  )
}
