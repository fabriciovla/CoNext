import { useEffect, useRef, useState } from 'react'
import Card from './Card'
import { Toggle } from './Switch'
import { IconChevronDown, IconDots } from './icons'
import { useT } from '../../lib/i18n.jsx'

// La tarjeta de un canal. Contesta una sola pregunta —¿esto está enganchado y a
// qué cuenta?— y lo hace en tres renglones: el logo con el nombre y la cuenta
// arriba, la fila de estado abajo, y lo técnico plegado al pie.
//
// La forma sale de mirar cómo se listan las integraciones en cualquier consola:
// **el estado es una fila entera y no una etiqueta arrinconada**. Como distintivo
// de 11px contra el borde derecho competía con el título por el mismo renglón y
// no dejaba lugar para el dato que lo acompaña —la calidad del número, cuántas
// cuentas están atendiendo—, que es justo lo que dice si el canal además de
// conectado está sano.
//
// **Las acciones viven en el menú de la esquina.** Eran tres botones en una
// franja al pie —Actualizar, Conectar otro, Desconectar— que ocupaban un cuarto
// de la tarjeta y ponían la destructiva a la misma distancia y con el mismo peso
// que la de refrescar. Ninguna se usa seguido: se entra a esta pantalla a mirar,
// no a reconectar. La excepción es conectar, que cuando el canal está apagado es
// lo único que hay para hacer y por eso va como botón sólido a todo el ancho.
//
// `tono` es un lavado del color de la marca detrás del logo. Es la excepción a
// que el acento sea el único color con voz, y por el mismo motivo por el que las
// marcas de Meta van con color literal: es lo que distingue una tarjeta de la
// otra antes de leer el título. Va bajo 0.12 de alfa a propósito — arriba de eso
// deja de ser un fondo y empieza a competir con el botón.
export default function ChannelCard({
  marca,
  titulo,
  // El renglón de abajo del título: a qué número o Página está enganchado.
  // Es el dato que de verdad cambia entre un cliente y otro.
  subtitulo,
  descripcion,
  estado,
  menu,
  accion,
  tono,
  children,
  className = '',
}) {
  return (
    <Card
      className={`relative flex min-w-0 flex-col ${className}`}
      bodyClassName="relative flex min-w-0 flex-1 flex-col p-5"
    >
      {/* Redondeado él y no recortado por la tarjeta: con `overflow-hidden` en
          la tarjeta, el panel del menú de la esquina quedaba cortado por el
          borde en vez de flotar encima. */}
      {tono && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${tono}, transparent 60%)` }}
        />
      )}

      <div className="relative flex min-w-0 items-start gap-3">
        {marca && <span className="flex shrink-0 items-center">{marca}</span>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-ink-primary">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-1 truncate text-[12.5px] text-ink-muted">{subtitulo}</p>}
        </div>
        {/* Tirado hacia afuera para que el ícono quede ópticamente contra el
            borde: su caja de 28px es casi toda aire alrededor de tres puntos. */}
        {menu && <span className="-mr-1.5 -mt-1 shrink-0">{menu}</span>}
      </div>

      {estado && <div className="relative mt-4">{estado}</div>}

      {descripcion && (
        <p className="relative mt-3.5 text-[12.5px] leading-relaxed text-ink-muted">{descripcion}</p>
      )}

      {children && <div className="relative mt-3.5 min-w-0">{children}</div>}

      {accion && <div className="relative mt-4">{accion}</div>}
    </Card>
  )
}

// La fila de estado: el punto y la palabra a la izquierda, y contra el borde
// derecho el dato que la califica —la calidad del número, cuántas cuentas están
// atendiendo—. Es lo único que cambia entre una visita y otra, así que es lo que
// tiene el fondo y el color de la tarjeta.
const ESTADOS = {
  conectado: { fondo: 'bg-status-good/[0.09]', texto: 'text-status-good', punto: 'bg-status-good' },
  problema: {
    fondo: 'bg-status-critical/[0.09]',
    texto: 'text-status-critical',
    punto: 'bg-status-critical',
  },
  neutro: { fondo: 'bg-tint/[0.05]', texto: 'text-ink-secondary', punto: 'bg-ink-faint' },
}

export function FilaEstado({ tono = 'neutro', detalle, children }) {
  const e = ESTADOS[tono]
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${e.fondo}`}>
      <span className={`flex min-w-0 items-center gap-2 text-[12.5px] font-medium ${e.texto}`}>
        <span aria-hidden="true" className={`h-[7px] w-[7px] shrink-0 rounded-full ${e.punto}`} />
        <span className="truncate">{children}</span>
      </span>
      {detalle && <span className="shrink-0 text-[11.5px] text-ink-muted">{detalle}</span>}
    </div>
  )
}

// El menú de la esquina. Mismo patrón que `Select`: una capa fija que tapa el
// resto de la pantalla para cerrar con un click afuera, y el panel encima. No
// hace falta un listener de captura como en la barra del sitio porque acá no
// hay dos menús que se peleen: hay uno por tarjeta.
//
// `items` es una lista y no `children` a propósito: cada ítem tiene que cerrar
// el menú además de hacer lo suyo, y con hijos sueltos eso hay que acordarse en
// cada llamada.
//
// Un ítem con `checked` es un interruptor —los dos canales de la Página— y no
// una acción: lleva la palanca a la derecha, `role="menuitemcheckbox"`, y
// **no cierra el menú**, porque casi siempre se toca uno y enseguida el otro.
// `{ separador: true }` mete la línea que los separa de las acciones, y `nota`
// es el renglón del pie, para lo que hay que aclarar de los interruptores sin
// meterlo adentro de cada uno.
export function MenuCanal({ ariaLabel, items, nota }) {
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef(null)

  // Escape cierra desde cualquier lado y no solo con el foco puesto en el
  // botón: si el menú quedó abierto, Escape lo cierra.
  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false)
        botonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto])

  const visibles = (items ?? []).filter(Boolean)
  if (visibles.length === 0) return null

  return (
    <div className="relative">
      <button
        ref={botonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        onClick={() => setAbierto((v) => !v)}
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint
          transition-colors duration-150 hover:bg-tint/[0.07] hover:text-ink-primary"
      >
        {/* Vertical y no horizontal: el de la esquina de una tarjeta es el de
            tres puntos parados, que es lo que la gente busca ahí. */}
        <IconDots size={16} className="rotate-90" />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAbierto(false)} />
          <div
            role="menu"
            className="animate-scale-in absolute right-0 top-full z-30 mt-1 min-w-[13.5rem]
              rounded-xl border border-tint/10 bg-surface-raised p-1 shadow-pop"
          >
            {visibles.map((item, i) => {
              if (item.separador) {
                return <div key={`sep-${i}`} className="my-1 border-t border-tint/[0.08]" />
              }

              const esInterruptor = item.checked !== undefined

              return (
                <button
                  key={item.label}
                  type="button"
                  role={esInterruptor ? 'menuitemcheckbox' : 'menuitem'}
                  aria-checked={esInterruptor ? item.checked : undefined}
                  title={item.title}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!esInterruptor) setAbierto(false)
                    item.onClick()
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px]
                    transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40
                    ${
                      item.peligro
                        ? 'text-ink-secondary hover:bg-status-critical/10 hover:text-status-critical'
                        : 'text-ink-secondary hover:bg-tint/[0.07] hover:text-ink-primary'
                    }`}
                >
                  <span className={esInterruptor ? 'shrink-0 font-medium' : 'min-w-0 flex-1'}>
                    {item.label}
                  </span>
                  {esInterruptor && (
                    <>
                      {item.hint && (
                        <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-muted">
                          {item.hint}
                        </span>
                      )}
                      <Toggle checked={item.checked} />
                    </>
                  )}
                </button>
              )
            })}

            {nota && (
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] leading-snug text-ink-faint">{nota}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Los ids de Meta van plegados. No son una configuración: son la referencia que
// se copia el día que algo falla y hay que buscar el número en la consola de
// Meta. Desplegados eran media tarjeta de dígitos que nadie lee, y son lo que
// hacía que las dos fichas midieran el doble de lo que dicen.
export function DatosConexion({ children, label }) {
  const t = useT()
  return (
    <details className="group border-t border-tint/[0.07] pt-2.5">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2 text-[12px] text-ink-muted
          transition-colors duration-150 hover:text-ink-primary [&::-webkit-details-marker]:hidden"
      >
        {label ?? t('canales.datosConexion')}
        <IconChevronDown
          size={13}
          className="text-ink-faint transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="mt-2">{children}</div>
      <p className="mt-2.5 text-[11px] leading-snug text-ink-faint">{t('canales.pistaCopiar')}</p>
    </details>
  )
}

// De cuántos dígitos del final alcanza para reconocer un id. Ocho: los ids de
// Meta comparten prefijo entre sí y lo que los distingue está al final.
const COLA_VISIBLE = 8

// Fila de dato conectado. El punteado del medio no es adorno: son pares
// etiqueta/valor de largos muy distintos, y sin nada que los una la vista tiene
// que saltar el hueco para emparejarlos.
//
// Los ids van **cortados por la cola y se copian al tocarlos**. Enteros son
// quince dígitos que en media tarjeta se partían en dos renglones, y nadie los
// lee: se los pega en la consola de Meta. El valor completo queda en el `title`
// para el caso en que el portapapeles esté bloqueado.
export function Dato({ label, children, copiable = false }) {
  const t = useT()
  const [copiado, setCopiado] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const valor = String(children ?? '')
  const corto = copiable && valor.length > COLA_VISIBLE + 1 ? `…${valor.slice(-COLA_VISIBLE)}` : valor

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiado(false), 1600)
    } catch {
      // Sin permiso de portapapeles no hay nada que hacer, y tampoco hay nada
      // roto: el valor entero está en el `title`.
    }
  }

  return (
    <div className="flex items-baseline gap-2 py-[3px]">
      <span className="shrink-0 text-[11.5px] text-ink-muted">{label}</span>
      <span
        aria-hidden="true"
        className="min-w-[1rem] flex-1 -translate-y-[3px] border-b border-dotted border-tint/20"
      />
      {copiable ? (
        <button
          type="button"
          title={valor}
          onClick={copiar}
          className="shrink-0 rounded text-[11px] text-ink-secondary transition-colors duration-150 hover:text-violet"
        >
          {copiado ? (
            <span className="text-status-good">{t('canales.copiado')}</span>
          ) : (
            <span className="font-mono">{corto}</span>
          )}
        </button>
      ) : (
        <span className="min-w-0 truncate text-right text-[11.5px] text-ink-secondary">{valor}</span>
      )}
    </div>
  )
}

// El aviso de que el canal dejó de andar. El texto crudo de Graph es un párrafo
// entero con fechas y horas en inglés —"Session has expired on Thursday,
// 27-Aug-26 21:00:00 PDT…"— que ocupaba un cuarto de la tarjeta para decir algo
// que se resuelve con un solo botón. Acá se dice qué pasa y qué hacer; el texto
// de Meta queda en el `title`, para cuando haya que pegarlo en un reporte.
export function AvisoCanal({ detalle, children }) {
  return (
    <p
      title={detalle || undefined}
      className="rounded-lg border border-status-critical/25 bg-status-critical/10 px-2.5 py-1.5 text-[11.5px] leading-snug text-status-critical"
    >
      {children}
    </p>
  )
}
