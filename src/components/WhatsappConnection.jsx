import Button from './ui/Button'
import ChannelCard, { EstadoCanal } from './ui/ChannelCard'
import ChannelLogo from './ui/ChannelLogo'
import { IconCheck } from './ui/icons'
import { useWhatsappConnection } from '../hooks/useWhatsappConnection'

// El verde de WhatsApp, apenas insinuado detrás del logo. Es el mismo literal
// que usa la marca: no sale de la paleta semántica y no cambia entre temas.
const TONO = 'rgba(37, 211, 102, 0.11)'

const BAJADA = 'Recibí y respondé desde el CRM los mensajes del número de WhatsApp Business del negocio.'

function Marco({ className = '', descripcion = BAJADA, distintivo, acciones, children }) {
  return (
    <ChannelCard
      className={className}
      tono={TONO}
      marca={<ChannelLogo channel="whatsapp" size={40} />}
      titulo="WhatsApp Business"
      descripcion={descripcion}
      distintivo={distintivo}
      acciones={acciones}
    >
      {children}
    </ChannelCard>
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
      <Marco className={className} descripcion={null}>
        <p className="text-[13px] text-ink-muted">Cargando…</p>
      </Marco>
    )
  }

  // Si no se pudo ni leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" acá manda a revisar variables que
  // suelen estar perfectas — el .env no se puede leer si nadie contesta.
  if (!config) {
    return (
      <Marco className={className} descripcion={null}>
        <p className="text-[13px] text-status-critical">No se pudo consultar el estado de la conexión.</p>
        {error && <p className="mt-2 text-[12px] text-ink-muted">{error}</p>}
      </Marco>
    )
  }

  // Sin las variables del .env el botón abriría un popup que falla con un error
  // de Meta que no explica nada. Mejor decir qué falta.
  if (!config.configurado) {
    return (
      <Marco
        className={className}
        descripcion="Falta configurar la app de Meta en el server."
        distintivo={<EstadoCanal>Sin configurar</EstadoCanal>}
      >
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Cargá <code className="text-ink-secondary">META_APP_ID</code>,{' '}
          <code className="text-ink-secondary">META_CONFIG_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code> en{' '}
          <code className="text-ink-secondary">server/.env</code> y reiniciá el server.
        </p>
      </Marco>
    )
  }

  const conectado = estado?.conectado

  const problemas = (
    <>
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
    </>
  )

  if (!conectado) {
    return (
      <Marco
        className={className}
        descripcion={`${BAJADA} Se abre una ventana de Meta: tu contraseña no pasa por acá.`}
        acciones={
          <Button variant="secondary" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar'}
          </Button>
        }
      >
        {problemas}
      </Marco>
    )
  }

  return (
    <Marco
      className={className}
      distintivo={
        estado.vigente ? (
          <EstadoCanal tono="conectado">
            <IconCheck size={12} />
            Conectado
          </EstadoCanal>
        ) : (
          <EstadoCanal tono="problema">Token vencido</EstadoCanal>
        )
      }
      acciones={
        <>
          <Button variant="ghost" size="sm" onClick={refrescar}>
            Actualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar otro número'}
          </Button>
        </>
      }
    >
      {/* Si el token dejó de servir, el número sigue en la base pero no entra
          ni sale nada. Vale más decirlo acá que dejar que se note como "no me
          llegan los mensajes". */}
      {!estado.vigente && estado.error && (
        <p className="mb-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
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

      {problemas}
    </Marco>
  )
}
