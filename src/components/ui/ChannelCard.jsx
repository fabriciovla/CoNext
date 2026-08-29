import Card from './Card'

// La tarjeta de un canal, con la forma de un catálogo: el nombre arriba a la
// izquierda, la marca del canal grande a la derecha, la bajada abajo, y la
// acción sola contra el borde derecho detrás de una divisoria.
//
// Las dos tarjetas de conexión (WhatsApp e Instagram/Messenger) compartían un
// `Marco` copiado, con el encabezado en banda del resto de Configuración: un
// glifo de 8px, el título chico y la acción mezclada con el estado en la misma
// fila. Servía cuando eran dos secciones más de un formulario; leídas como lo
// que son —los servicios que el negocio engancha al CRM— lo que se busca de un
// vistazo es cuál es cada uno y dónde se aprieta para conectarlo, y eso es lo
// que esta forma pone primero.
//
// `tono` es un lavado del color de la marca detrás del logo. Es la excepción a
// que el acento sea el único color con voz, y por el mismo motivo por el que
// las marcas de Meta van con color literal: es lo que distingue una tarjeta de
// la otra antes de leer el título. Va bajo 0.12 de alfa a propósito — arriba de
// eso deja de ser un fondo y empieza a competir con el botón.
export default function ChannelCard({
  marca,
  titulo,
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
      bodyClassName="relative flex min-w-0 flex-1 flex-col p-5"
    >
      {tono && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `radial-gradient(140% 110% at 100% 0%, ${tono}, transparent 55%)` }}
        />
      )}

      {/* El cuerpo crece y la fila de acciones queda apoyada abajo: con dos
          tarjetas al lado, los botones se leen en la misma línea aunque una
          diga más que la otra. */}
      <div className="relative min-w-0 flex-1 pb-5">
        {distintivo && <div className="mb-3 flex">{distintivo}</div>}

        <div className="flex items-start justify-between gap-4">
          <h2 className="min-w-0 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink-primary">
            {titulo}
          </h2>
          {marca && <span className="flex shrink-0 items-center">{marca}</span>}
        </div>

        {descripcion && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{descripcion}</p>
        )}

        {children && <div className="mt-4 min-w-0">{children}</div>}
      </div>

      {acciones && (
        <div className="relative flex items-center justify-end gap-2 border-t border-tint/[0.06] pt-4">
          {acciones}
        </div>
      )}
    </Card>
  )
}

// El distintivo de arriba a la izquierda. Donde el catálogo pone "Popular" o
// "Beta", acá va lo único que de verdad cambia entre una visita y otra: si el
// canal está conectado, si perdió el acceso, o si todavía no se enganchó.
const TONOS = {
  conectado: 'bg-status-good/[0.12] text-status-good',
  problema: 'bg-status-critical/[0.12] text-status-critical',
  neutro: 'bg-tint/[0.06] text-ink-muted',
}

export function EstadoCanal({ tono = 'neutro', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium ${TONOS[tono]}`}
    >
      {children}
    </span>
  )
}
