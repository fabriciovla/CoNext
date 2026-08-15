import Card from './ui/Card'
import Button from './ui/Button'
import { IconCheck } from './ui/icons'
import { useWhatsappConnection } from '../hooks/useWhatsappConnection'

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

export default function WhatsappConnection() {
  const { config, estado, cargando, conectando, error, avisos, sdkListo, conectar, refrescar } =
    useWhatsappConnection()

  if (cargando) {
    return (
      <Card title="WhatsApp" className="mx-auto max-w-xl">
        <p className="text-sm text-ink-muted">Cargando…</p>
      </Card>
    )
  }

  // Si no se pudo ni leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" acá manda a revisar variables que
  // suelen estar perfectas — el .env no se puede leer si nadie contesta.
  if (!config) {
    return (
      <Card title="WhatsApp" className="mx-auto max-w-xl">
        <p className="text-sm text-status-critical">No se pudo consultar el estado de la conexión.</p>
        {error && <p className="mt-2 text-xs text-ink-muted">{error}</p>}
      </Card>
    )
  }

  // Sin las variables del .env el botón abriría un popup que falla con un error
  // de Meta que no explica nada. Mejor decir qué falta.
  if (!config.configurado) {
    return (
      <Card title="WhatsApp" className="mx-auto max-w-xl">
        <p className="text-sm text-ink-secondary">
          Falta configurar la app de Meta en el server.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Cargá <code className="text-ink-secondary">META_APP_ID</code>,{' '}
          <code className="text-ink-secondary">META_CONFIG_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code> en{' '}
          <code className="text-ink-secondary">server/.env</code> y reiniciá el server.
        </p>
      </Card>
    )
  }

  const conectado = estado?.conectado

  return (
    <Card
      title="WhatsApp"
      className="mx-auto max-w-xl"
      actions={
        conectado && (
          <Button variant="ghost" size="sm" onClick={refrescar}>
            Actualizar
          </Button>
        )
      }
    >
      {!conectado && (
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Conectá tu número de WhatsApp Business para empezar a recibir mensajes en el CRM.
          </p>
          <p className="text-xs text-ink-muted">
            Se abre una ventana de Meta donde entrás con tu cuenta de Facebook y elegís el número.
            Tu contraseña no pasa por acá.
          </p>
          <Button onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar WhatsApp'}
          </Button>
        </div>
      )}

      {conectado && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {estado.vigente ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-status-good">
                <IconCheck size={14} />
                Conectado
              </span>
            ) : (
              <span className="text-sm font-medium text-status-critical">
                Conectado, pero el token no responde
              </span>
            )}
          </div>

          {/* Si el token dejó de servir, el número sigue en la base pero no
              entra ni sale nada. Vale más decirlo acá que dejar que se note
              como "no me llegan los mensajes". */}
          {!estado.vigente && estado.error && (
            <p className="rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-xs text-status-critical">
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
        <p className="mt-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-xs text-status-critical">
          {error}
        </p>
      )}

      {avisos.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {avisos.map((aviso) => (
            <li
              key={aviso}
              className="rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-2 text-xs text-ink-muted"
            >
              {aviso}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
