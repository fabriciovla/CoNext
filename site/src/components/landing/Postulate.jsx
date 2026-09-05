import { useEffect, useId, useState } from 'react'
import Boton from '../Boton.jsx'
import { IconArrowRight, IconCheck } from '../icons.jsx'

const CAMPO =
  'w-full rounded-xl border border-tint/[0.12] bg-transparent px-3.5 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-faint transition-colors duration-150 focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30'

// El plazo es fijo —diez días desde que se publicó esta ronda— y no diez días
// desde que cada visitante abre la página: un contador que arranca de nuevo en
// cada visita no cierra nunca.
const LIMITE = new Date('2026-09-15T23:59:59-03:00').getTime()

function calcularRestante() {
  const ms = Math.max(0, LIMITE - Date.now())
  const total = Math.floor(ms / 1000)
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
    vencido: ms <= 0,
  }
}

function Segmento({ valor, etiqueta }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums text-[22px] font-semibold leading-none tracking-tight text-ink-primary sm:text-[26px]">
        {String(valor).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10.5px] uppercase tracking-wide text-ink-muted">{etiqueta}</span>
    </div>
  )
}

export default function Postulate({ copy, apiUrl, idioma = 'es' }) {
  const [restante, setRestante] = useState(calcularRestante)
  const [valores, setValores] = useState({ nombre: '', contacto: '' })
  const [estado, setEstado] = useState('idle') // idle | enviando | listo | error
  const formId = useId()

  useEffect(() => {
    const t = window.setInterval(() => setRestante(calcularRestante()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const onChange = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!valores.nombre.trim() || !valores.contacto.trim() || estado === 'enviando') return
    setEstado('enviando')
    try {
      if (apiUrl) {
        const r = await fetch(`${apiUrl}/postulaciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...valores, idioma }),
        })
        if (!r.ok) throw new Error('falló')
      }
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet/[0.08] sm:h-28 sm:w-28">
        <img src="/mascota-postulate.svg" alt="" aria-hidden="true" className="h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem]" />
      </div>

      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-violet/[0.08] px-3 py-1 text-[12px] font-semibold text-violet">
        <span className="h-1.5 w-1.5 rounded-full bg-violet"></span>
        {copy.etiqueta}
      </span>

      <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink-primary sm:text-[32px]">
        {copy.titulo}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-secondary sm:text-[16px]">
        {copy.bajada}
      </p>

      {!restante.vencido && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[12.5px] font-medium text-ink-muted">{copy.countdownEtiqueta}</p>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-tint/[0.1] bg-surface-card px-4 py-3 sm:gap-4">
            <Segmento valor={restante.dias} etiqueta={copy.dias} />
            <span className="text-[17px] text-ink-faint">:</span>
            <Segmento valor={restante.horas} etiqueta={copy.horas} />
            <span className="text-[17px] text-ink-faint">:</span>
            <Segmento valor={restante.minutos} etiqueta={copy.minutos} />
            <span className="text-[17px] text-ink-faint">:</span>
            <Segmento valor={restante.segundos} etiqueta={copy.segundos} />
          </div>
        </div>
      )}

      {estado === 'listo' ? (
        <div className="animate-in mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl border border-violet/25 bg-violet/[0.06] px-5 py-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-ink-inverted">
            <IconCheck size={14} />
          </span>
          <p className="text-[14.5px] font-medium text-ink-primary">{copy.listoTexto}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <label className="block flex-1">
              <span className="sr-only">{copy.nombrePh}</span>
              <input
                id={`${formId}-nombre`}
                value={valores.nombre}
                onChange={onChange('nombre')}
                placeholder={copy.nombrePh}
                autoComplete="name"
                required
                className={CAMPO}
              />
            </label>
            <label className="block flex-1">
              <span className="sr-only">{copy.contactoPh}</span>
              <input
                id={`${formId}-contacto`}
                type="email"
                value={valores.contacto}
                onChange={onChange('contacto')}
                placeholder={copy.contactoPh}
                autoComplete="email"
                required
                className={CAMPO}
              />
            </label>
            <Boton
              as="button"
              type="submit"
              tamano="lg"
              disabled={estado === 'enviando'}
              className="shrink-0 disabled:pointer-events-none disabled:opacity-60"
            >
              {estado === 'enviando' ? copy.enviando : copy.cta}
              {estado !== 'enviando' && <IconArrowRight size={17} />}
            </Boton>
          </div>
          {estado === 'error' && <p className="mt-2.5 text-[13px] text-status-critical">{copy.errorTexto}</p>}
        </form>
      )}
    </div>
  )
}
