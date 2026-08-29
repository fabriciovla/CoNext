import Button from './ui/Button'
import Switch from './ui/Switch'
import ChannelCard, { EstadoCanal } from './ui/ChannelCard'
import ChannelLogo from './ui/ChannelLogo'
import { IconCheck } from './ui/icons'
import { useMetaConnection } from '../hooks/useMetaConnection'

// El violeta de Instagram, que es el que domina las dos marcas puestas juntas.
// Literal, como el verde de WhatsApp: es de Meta, no de nuestra paleta.
const TONO = 'rgba(150, 47, 191, 0.11)'

const BAJADA =
  'Los mensajes de Messenger y los directos de Instagram, en la misma bandeja. Los dos cuelgan de la misma Página de Facebook: se conectan juntos.'

// La marca de esta tarjeta son dos: es un solo trámite que engancha dos
// canales, y un logo solo dejaría afuera al otro. Van uno al lado del otro y no
// superpuestos como en un avatar: estos archivos no traen contorno blanco, así
// que encimados el círculo de Messenger se comería la esquina de Instagram.
function Marcas() {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <ChannelLogo channel="messenger" size={34} />
      <ChannelLogo channel="instagram" size={34} />
    </span>
  )
}

function Marco({ className = '', descripcion = BAJADA, distintivo, acciones, children }) {
  return (
    <ChannelCard
      className={className}
      tono={TONO}
      marca={<Marcas />}
      titulo="Instagram y Messenger"
      descripcion={descripcion}
      distintivo={distintivo}
      acciones={acciones}
    >
      {children}
    </ChannelCard>
  )
}

// Igual que en la tarjeta de WhatsApp: son ids largos de Meta, así que van en
// monoespaciada y se pueden cortar sin romper el ancho.
function Dato({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className="break-all text-right font-mono text-xs text-ink-secondary">{children}</span>
    </div>
  )
}

export default function MetaConnection({ className = '' }) {
  const {
    config,
    estado,
    cargando,
    conectando,
    error,
    avisos,
    sdkListo,
    paginas,
    conectar,
    conectarPagina,
    cambiarCanal,
    cancelarSeleccion,
    refrescar,
  } = useMetaConnection()

  if (cargando) {
    return (
      <Marco className={className} descripcion={null}>
        <p className="text-[13px] text-ink-muted">Cargando…</p>
      </Marco>
    )
  }

  // Si no se pudo leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" manda a revisar variables que
  // suelen estar perfectas.
  if (!config) {
    return (
      <Marco className={className} descripcion={null}>
        <p className="text-[13px] text-status-critical">No se pudo consultar el estado de la conexión.</p>
        {error && <p className="mt-2 text-[12px] text-ink-muted">{error}</p>}
      </Marco>
    )
  }

  // Instagram y Messenger no usan config_id: no son Embedded Signup. Por eso
  // esta tarjeta puede estar disponible aunque la de WhatsApp diga que falta.
  if (!config.metaConfigurado) {
    return (
      <Marco
        className={className}
        descripcion="Falta configurar la app de Meta en el server."
        distintivo={<EstadoCanal>Sin configurar</EstadoCanal>}
      >
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Cargá <code className="text-ink-secondary">META_APP_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code> en{' '}
          <code className="text-ink-secondary">server/.env</code> y reiniciá el server.
        </p>
      </Marco>
    )
  }

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

  // El selector de Página se come la tarjeta mientras está abierto: es una
  // decisión que hay que tomar antes de seguir, y mostrarla al lado del estado
  // anterior invita a leer el estado viejo como si fuera el nuevo.
  if (paginas.length > 0) {
    return (
      <Marco
        className={className}
        descripcion="Administrás varias Páginas. Elegí cuál querés atender desde el CRM."
        acciones={
          <Button variant="ghost" size="sm" onClick={cancelarSeleccion} disabled={conectando}>
            Cancelar
          </Button>
        }
      >
        <ul className="space-y-1.5">
          {paginas.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => conectarPagina(p.id)}
                disabled={conectando}
                className="w-full rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-2.5 text-left transition-colors duration-200 hover:bg-tint/[0.09] disabled:opacity-50"
              >
                <span className="block text-[13px] font-medium text-ink-primary">{p.nombre}</span>
                <span className="mt-0.5 block text-[12px] text-ink-muted">
                  {p.igUsername ? `Instagram: @${p.igUsername}` : 'Sin Instagram asociado'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {error && (
          <p className="mt-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
            {error}
          </p>
        )}
      </Marco>
    )
  }

  const conectado = estado?.conectado

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
          // No dice "Token vencido": los tokens de Página sacados con un token
          // de usuario largo no vencen. Si Graph deja de aceptarlo es porque se
          // revocó el acceso, y nombrarlo "vencido" mandaba a buscar una
          // renovación que no existe.
          <EstadoCanal tono="problema">Sin acceso</EstadoCanal>
        )
      }
      acciones={
        <>
          <Button variant="ghost" size="sm" onClick={refrescar}>
            Actualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar otra Página'}
          </Button>
        </>
      }
    >
      {/* Si el token dejó de servir, la Página sigue en la base pero no entra
          ni sale nada. Vale más decirlo acá que dejar que se note como "no me
          llegan los mensajes". */}
      {!estado.vigente && estado.error && (
        <p className="mb-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
          {estado.error} Volvé a conectar la Página para retomar los mensajes.
        </p>
      )}

      {/* Los interruptores van arriba de los ids: son lo único que el negocio
          decide acá, y los identificadores de Meta son referencia para cuando
          algo falla.

          La conexión es una sola porque Meta entrega un token que cubre los dos
          canales; dos botones de "conectar" abrirían el mismo popup y guardarían
          lo mismo. Lo que sí se elige es qué atiende el CRM. */}
      <div className="space-y-2">
        <Switch
          label="Instagram"
          hint={
            estado.igUsername
              ? `Contestar los mensajes directos de @${estado.igUsername}`
              : 'La Página no tiene una cuenta de Instagram asociada'
          }
          checked={Boolean(estado.canales?.instagram) && Boolean(estado.igAccountId)}
          // Sin cuenta asociada no hay nada que prender: dejarlo activable
          // sería ofrecer atender un canal que no existe.
          disabled={!estado.igAccountId}
          onChange={(v) => cambiarCanal('instagram', v)}
        />
        <Switch
          label="Messenger"
          hint={`Contestar los mensajes de la Página${estado.pageName ? ` ${estado.pageName}` : ''}`}
          checked={Boolean(estado.canales?.messenger)}
          onChange={(v) => cambiarCanal('messenger', v)}
        />
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
        Apagar un canal no lo desconecta: los mensajes le siguen llegando al negocio por Instagram o
        Facebook, el CRM no los toca.
      </p>

      <div className="mt-4 divide-y divide-tint/[0.06] border-y border-tint/[0.06]">
        {estado.pageName && <Dato label="Página">{estado.pageName}</Dato>}
        <Dato label="Page ID">{estado.pageId}</Dato>
        {estado.igAccountId && <Dato label="Instagram ID">{estado.igAccountId}</Dato>}
      </div>

      {problemas}
    </Marco>
  )
}
