import Card from './Card'
import { IconChevronDown } from './icons'
import { useT } from '../../lib/i18n.jsx'

// La tarjeta de un canal. Es una ficha compacta, no una sección de formulario:
// una sola fila de encabezado —logo, nombre, a quién está conectado, y el
// estado contra el borde derecho—, el cuerpo con lo único que se decide acá, y
// la acción abajo. Las dos entran a la par sin que ninguna pase de media
// pantalla de alto.
//
// La versión anterior apilaba cuatro bloques antes de llegar al contenido
// (distintivo, título, logo grande a la derecha, bajada de dos renglones) y
// dejaba los ids de Meta desplegados a la vista. Todo eso se lee una vez, el
// día que se conecta: la bajada solo aparece mientras el canal está
// desconectado —que es cuando hay que explicar qué se está por enganchar— y
// los ids viven plegados en `DatosConexion`.
//
// `tono` es un lavado del color de la marca detrás del logo. Es la excepción a
// que el acento sea el único color con voz, y por el mismo motivo por el que
// las marcas de Meta van con color literal: es lo que distingue una tarjeta de
// la otra antes de leer el título. Va bajo 0.12 de alfa a propósito — arriba de
// eso deja de ser un fondo y empieza a competir con el botón.
export default function ChannelCard({
  marca,
  titulo,
  // El renglón de abajo del título: a qué número o Página está enganchado.
  // Es el dato que de verdad cambia entre un cliente y otro.
  subtitulo,
  descripcion,
  distintivo,
  acciones,
  tono,
  children,
  className = '',
}) {
  return (
    <Card
      className={`relative flex min-w-0 flex-col overflow-hidden ${className}`}
      bodyClassName="relative flex min-w-0 flex-1 flex-col p-4"
    >
      {tono && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `radial-gradient(120% 100% at 100% 0%, ${tono}, transparent 60%)` }}
        />
      )}

      {/* El cuerpo crece y la fila de acciones queda apoyada abajo: con dos
          tarjetas al lado, los botones se leen en la misma línea aunque una
          diga más que la otra. */}
      <div className="relative min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2.5">
          {marca && <span className="flex shrink-0 items-center">{marca}</span>}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-ink-primary">
              {titulo}
            </h2>
            {subtitulo && <p className="mt-0.5 truncate text-[12px] text-ink-muted">{subtitulo}</p>}
          </div>
          {distintivo && <span className="shrink-0">{distintivo}</span>}
        </div>

        {descripcion && (
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">{descripcion}</p>
        )}

        {children && <div className="mt-3 min-w-0">{children}</div>}
      </div>

      {acciones && (
        <div className="relative mt-4 flex items-center justify-end gap-1.5 border-t border-tint/[0.06] pt-3">
          {acciones}
        </div>
      )}
    </Card>
  )
}

// El distintivo de arriba a la derecha. Lo único que de verdad cambia entre una
// visita y otra: si el canal está conectado, si perdió el acceso, o si todavía
// no se enganchó.
const TONOS = {
  conectado: 'bg-status-good/[0.12] text-status-good',
  problema: 'bg-status-critical/[0.12] text-status-critical',
  neutro: 'bg-tint/[0.06] text-ink-muted',
}

export function EstadoCanal({ tono = 'neutro', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${TONOS[tono]}`}
    >
      {children}
    </span>
  )
}

// Los ids de Meta van plegados. No son una configuración: son la referencia que
// se copia el día que algo falla y hay que buscar el número en la consola de
// Meta. Desplegados eran media tarjeta de dígitos que nadie lee, y son lo que
// hacía que las dos fichas midieran el doble de lo que dicen.
export function DatosConexion({ children, label }) {
  const t = useT()
  return (
    <details className="group mt-3 border-t border-tint/[0.06] pt-2">
      <summary
        className="flex cursor-pointer list-none items-center gap-1 text-[11.5px] text-ink-muted
          transition-colors duration-150 hover:text-ink-primary [&::-webkit-details-marker]:hidden"
      >
        <IconChevronDown
          size={11}
          className="text-ink-faint transition-transform duration-200 group-open:rotate-180"
        />
        {label ?? t('canales.datosConexion')}
      </summary>
      <div className="mt-1 divide-y divide-tint/[0.06]">{children}</div>
    </details>
  )
}

// Fila de dato conectado. Los valores son ids largos de Meta, así que van en
// monoespaciada y se pueden cortar sin romper el ancho de la tarjeta.
export function Dato({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="shrink-0 text-[11.5px] text-ink-muted">{label}</span>
      <span className="break-all text-right font-mono text-[11px] text-ink-secondary">{children}</span>
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
