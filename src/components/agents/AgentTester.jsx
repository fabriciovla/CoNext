import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import FormattedText from '../ui/FormattedText'
import { IconBolt, IconNote, IconSend, IconSparkles } from '../ui/icons'
import { apiPost } from '../../api/client'
import { useT } from '../../lib/i18n.jsx'

// Probar el agente sin mandarle nada a nadie.
//
// Es la mitad derecha de la pantalla del agente y no un modal: se prueba
// mientras se edita —se cambia una instrucción, se vuelve a preguntar—, y un
// modal obliga a cerrar para tocar y a abrir para ver. Por eso también se queda
// fijo mientras la columna de la izquierda scrollea.
//
// El hilo vive acá y en ningún lado más: no se guarda, no entra a la bandeja y
// se pierde al salir de la pantalla. Cambiar de agente lo borra, que es lo
// correcto — la conversación era con el otro.

// Los globos son los mismos de la bandeja, en chico: mismo lado por autor,
// mismo relleno, sin borde. Es la misma pantalla que se está simulando.
function Globo({ mensaje }) {
  const t = useT()
  const esDelCliente = mensaje.direction === 'in'

  if (mensaje.direction === 'error') {
    return (
      <li className="flex justify-center">
        <p className="max-w-[90%] rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] leading-snug text-status-critical">
          {mensaje.text}
        </p>
      </li>
    )
  }

  return (
    <li className={`flex flex-col ${esDelCliente ? 'items-start' : 'items-end'}`}>
      <div
        className={`min-w-0 max-w-[85%] rounded-2xl px-3 py-2 ${
          esDelCliente ? 'rounded-bl-md bg-tint/[0.06]' : 'rounded-br-md bg-violet-soft'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.45] text-ink-primary">
          <FormattedText>{mensaje.text}</FormattedText>
        </p>
      </div>

      {/* Lo único que la prueba puede contestar y la conversación real no deja
          ver hasta que ya pasó: con este mensaje, ¿salía solo o te quedaba para
          revisar? Es la pregunta por la que alguien prueba un agente. */}
      {!esDelCliente && mensaje.canAutoSend != null && (
        <p
          title={t(mensaje.canAutoSend ? 'agentes.seHubieraMandadoTitle' : 'agentes.quedabaBorradorTitle')}
          className={`mt-1 flex items-center gap-1 px-1 text-[11px] ${
            mensaje.canAutoSend ? 'text-ink-faint' : 'text-status-warning'
          }`}
        >
          {mensaje.canAutoSend ? <IconBolt size={11} /> : <IconNote size={11} />}
          {t(mensaje.canAutoSend ? 'agentes.seHubieraMandado' : 'agentes.quedabaBorrador')}
        </p>
      )}
    </li>
  )
}

export default function AgentTester({ agentId, agentEmoji, sinGuardar = false, contexto = null }) {
  const t = useT()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [esperando, setEsperando] = useState(false)
  // La segunda pestaña no es un ajuste más: es de dónde salen las respuestas
  // —el catálogo, el horario, el idioma, el material—, que es lo primero que
  // hay que mirar cuando la prueba contesta algo raro. Vive acá al lado y no en
  // otra pantalla justamente por eso.
  const [pestaña, setPestaña] = useState('chat')
  const finRef = useRef(null)

  // Cambiar de agente empieza de cero: el hilo era con el otro y las respuestas
  // de arriba no son las que este habría dado.
  useEffect(() => {
    setMensajes([])
    setTexto('')
  }, [agentId])

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [mensajes, esperando])

  const enviar = async () => {
    const limpio = texto.trim()
    if (!limpio || esperando || !agentId) return

    // El historial que se manda es el de la prueba, así que el agente contesta
    // como en una conversación de verdad y no a cada mensaje por separado. Los
    // avisos de error no van: no los escribió nadie.
    const hilo = [...mensajes.filter((m) => m.direction !== 'error'), { direction: 'in', text: limpio }]
    setMensajes(hilo)
    setTexto('')
    setEsperando(true)

    try {
      const { reply, canAutoSend } = await apiPost(`/agents/${agentId}/test`, {
        messages: hilo.map((m) => ({ direction: m.direction, text: m.text })),
      })
      setMensajes((prev) => [...prev, { direction: 'out', text: reply, canAutoSend }])
    } catch (err) {
      setMensajes((prev) => [...prev, { direction: 'error', text: err.message }])
    } finally {
      setEsperando(false)
    }
  }

  return (
    // `h-full`: la tarjeta ocupa el alto que le da la columna y no el de su
    // contenido. Es lo que hace que el cuadro de escribir se quede quieto abajo
    // en vez de subir y bajar con cada mensaje del hilo.
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-tint/[0.08] bg-surface-card shadow-card">
      <header className="shrink-0 border-b border-tint/[0.06] px-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink-primary">
            {t('agentes.probar')}
          </h2>
          {pestaña === 'chat' && mensajes.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setMensajes([])}>
              {t('agentes.reiniciarChat')}
            </Button>
          )}
        </div>

        {/* Las pestañas van subrayadas y no como pastillas: son dos vistas de lo
            mismo, no dos filtros. */}
        {contexto && (
          <div className="-mb-px mt-2 flex gap-4">
            {[
              ['chat', 'agentes.probarTab'],
              ['contexto', 'agentes.contextoTab'],
            ].map(([clave, texto]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setPestaña(clave)}
                aria-current={pestaña === clave}
                className={`border-b-2 pb-2 text-[12.5px] transition-colors duration-150 ${
                  pestaña === clave
                    ? 'border-violet text-ink-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-primary'
                }`}
              >
                {t(texto)}
              </button>
            ))}
          </div>
        )}
      </header>

      {pestaña === 'contexto' && <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{contexto}</div>}

      <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-4 ${pestaña === 'chat' ? '' : 'hidden'}`}>
        {mensajes.length === 0 ? (
          // El vacío explica de dónde saca las respuestas, que es lo que hace
          // que la prueba sirva: si contesta mal, el problema está en el
          // catálogo, en el horario o en el material, y esto lo dice antes.
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-tint/[0.08] bg-tint/[0.03] text-[18px] leading-none">
              {sinGuardar ? <IconSparkles size={18} className="text-ink-muted" /> : agentEmoji || '🤖'}
            </span>
            <p className="text-[13.5px] font-medium text-ink-primary">
              {sinGuardar ? t('agentes.probarSinGuardar') : t('agentes.probarVacioTitulo')}
            </p>
            {!sinGuardar && (
              <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-ink-muted">
                {t('agentes.probarVacio')}
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {mensajes.map((mensaje, i) => (
              <Globo key={i} mensaje={mensaje} />
            ))}
            {esperando && (
              <li className="flex items-center gap-1.5 px-1 text-[12px] text-ink-faint">
                {/* El punto que late es lo único que se mueve en esta pantalla,
                    y no adorna: una respuesta del modelo tarda segundos y sin
                    esto la prueba parece haberse colgado. */}
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
                {t('agentes.pensando')}
              </li>
            )}
            <li ref={finRef} aria-hidden="true" />
          </ul>
        )}
      </div>

      {/* El cuadro de escribir se esconde en la otra pestaña: ahí no hay a
          quién escribirle, y dejarlo abajo invita a tipear en el vacío. */}
      <div className={`shrink-0 border-t border-tint/[0.06] p-3 ${pestaña === 'chat' ? '' : 'hidden'}`}>
        <div className="flex items-end gap-2 rounded-xl border border-tint/[0.1] px-3 py-2 focus-within:border-violet/50">
          <textarea
            rows={1}
            value={texto}
            disabled={sinGuardar || !agentId}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              // Enter manda y Shift+Enter baja de renglón, igual que el composer
              // de la bandeja: es el mismo gesto en la misma app.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder={t('agentes.probarPlaceholder')}
            aria-label={t('agentes.probarPlaceholder')}
            className="max-h-28 min-h-[1.5rem] flex-1 resize-none bg-transparent text-[13.5px] leading-relaxed
              text-ink-primary placeholder:text-ink-faint focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={enviar}
            disabled={!texto.trim() || esperando || sinGuardar}
            aria-label={t('agentes.probarPlaceholder')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet text-ink-inverted
              transition-colors duration-150 hover:bg-violet/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconSend size={14} />
          </button>
        </div>

        <p className="mt-2 px-1 text-[11px] leading-snug text-ink-faint">{t('agentes.probarPie')}</p>
      </div>
    </section>
  )
}
