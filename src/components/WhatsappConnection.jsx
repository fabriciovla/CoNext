import Card from './ui/Card'
import Button from './ui/Button'
import { IconCheck, IconPhone } from './ui/icons'
import { useWhatsappConnection } from '../hooks/useWhatsappConnection'

// Misma banda de encabezado que las otras tarjetas de Configuración: el
// título no se estira a un riel vacío, y el estado (conectado, actualizar)
// ocupa el lado derecho.
function Marco({ className = '', meta, children }) {
  return (
    <Card className={`min-w-0 overflow-hidden ${className}`} bodyClassName="p-0">
      <div className="flex items-start gap-3 border-b border-tint/[0.06] bg-tint/[0.02] px-5 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
          <IconPhone size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold text-ink-primary">WhatsApp</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
            El canal por el que entran y salen los mensajes.
          </p>
        </div>
        {meta && <div className="shrink-0 pt-0.5">{meta}</div>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

// Fila de dato conectado. Los valores son ids largos de Meta, así que van en
// monoespaciada y se pueden cortar sin romper el ancho de la card.
function Dato({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className="break-all text-right font-mono text-xs text-ink-secondary">{children}</span>
    </div>
  )
}

export default function WhatsappConnection({ className = '' }) {
  const { config, estado, cargando, conectando, error, avisos, sdkListo, conectar, refrescar } =
    useWhatsappConnection()

  if (cargando) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-ink-muted">Cargando…</p>
      </Marco>
    )
  }

  // Si no se pudo ni leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" acá manda a revisar variables que
  // suelen estar perfectas — el .env no se puede leer si nadie contesta.
  if (!config) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-status-critical">No se pudo consultar el estado de la conexión.</p>
        {error && <p className="mt-2 text-[12px] text-ink-muted">{error}</p>}
      </Marco>
    )
  }

  // Sin las variables del .env el botón abriría un popup que falla con un error
  // de Meta que no explica nada. Mejor decir qué falta.
  if (!config.configurado) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-ink-secondary">Falta configurar la app de Meta en el server.</p>
        <p className="mt-2 text-[12px] text-ink-muted">
          Cargá <code className="text-ink-secondary">META_APP_ID</code>,{' '}
          <code className="text-ink-secondary">META_CONFIG_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code> en{' '}
          <code className="text-ink-secondary">server/.env</code> y reiniciá el server.
        </p>
      </Marco>
    )
  }

  const conectado = estado?.conectado

  return (
    <Marco
      className={className}
      meta={
        conectado ? (
          <div className="flex items-center gap-2">
            {estado.vigente ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-status-good">
                <IconCheck size={13} />
                Conectado
              </span>
            ) : (
              <span className="text-[12px] font-medium text-status-critical">Token vencido</span>
            )}
            <Button variant="ghost" size="sm" onClick={refrescar}>
              Actualizar
            </Button>
          </div>
        ) : null
      }
    >
      {!conectado && (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Conectá tu número de WhatsApp Business para empezar a recibir mensajes en el CRM. Se abre
            una ventana de Meta: tu contraseña no pasa por acá.
          </p>
          <Button onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar WhatsApp'}
          </Button>
        </div>
      )}

      {conectado && (
        <div className="space-y-4">
          {/* Si el token dejó de servir, el número sigue en la base pero no
              entra ni sale nada. Vale más decirlo acá que dejar que se note
              como "no me llegan los mensajes". */}
          {!estado.vigente && estado.error && (
            <p className="rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
              {estado.error} — volvé a conectar el número.
            </p>
          )}

          <div className="divide-y divide-tint/[0.06] border-y border-tint/[0.06]">
            {estado.numero && <Dato label="Número">{estado.numero}</Dato>}
            {estado.nombre && <Dato label="Nombre">{estado.nombre}</Dato>}
            {estado.calidad && <Dato label="Calidad">{estado.calidad}</Dato>}
            <Dato label="Phone number ID">{estado.phoneNumberId}</Dato>
            {estado.wabaId && <Dato label="WABA ID">{estado.wabaId}</Dato>}
          </div>

          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar otro número'}
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
          {error}
        </p>
      )}

      {avisos.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {avisos.map((aviso) => (
            <li
              key={aviso}
              className="rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-2 text-[12px] text-ink-muted"
            >
              {aviso}
            </li>
          ))}
        </ul>
      )}
    </Marco>
  )
}
