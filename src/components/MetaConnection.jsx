import Card from './ui/Card'
import Button from './ui/Button'
import { IconCheck } from './ui/icons'
import ChannelMark from './ui/ChannelMark'
import { useMetaConnection } from '../hooks/useMetaConnection'

// Misma banda de encabezado que WhatsappConnection y que el resto de
// Configuración. La diferencia es el distintivo: donde esa tarjeta pone un
// ícono nuestro adentro de un cuadradito violeta, esta pone las dos marcas de
// Meta. Es una tarjeta que habla de dos productos con logo propio, y un glifo
// genérico diría menos que los logos que la persona ya reconoce.
function Marco({ className = '', meta, children }) {
  return (
    <Card className={`min-w-0 overflow-hidden ${className}`} bodyClassName="p-0">
      <div className="flex items-start gap-3 border-b border-tint/[0.06] bg-tint/[0.02] px-5 py-3.5">
        <span className="flex h-8 shrink-0 items-center gap-1">
          <ChannelMark channel="instagram" size={18} />
          <ChannelMark channel="messenger" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold text-ink-primary">Instagram y Messenger</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
            Los dos cuelgan de la misma Página de Facebook: se conectan juntos.
          </p>
        </div>
        {meta && <div className="shrink-0 pt-0.5">{meta}</div>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
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
    cancelarSeleccion,
    refrescar,
  } = useMetaConnection()

  if (cargando) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-ink-muted">Cargando…</p>
      </Marco>
    )
  }

  // Si no se pudo leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" manda a revisar variables que
  // suelen estar perfectas.
  if (!config) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-status-critical">No se pudo consultar el estado de la conexión.</p>
        {error && <p className="mt-2 text-[12px] text-ink-muted">{error}</p>}
      </Marco>
    )
  }

  // Instagram y Messenger no usan config_id: no son Embedded Signup. Por eso
  // esta tarjeta puede estar disponible aunque la de WhatsApp diga que falta.
  if (!config.metaConfigurado) {
    return (
      <Marco className={className}>
        <p className="text-[13px] text-ink-secondary">Falta configurar la app de Meta en el server.</p>
        <p className="mt-2 text-[12px] text-ink-muted">
          Cargá <code className="text-ink-secondary">META_APP_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code> en{' '}
          <code className="text-ink-secondary">server/.env</code> y reiniciá el server.
        </p>
      </Marco>
    )
  }

  const conectado = estado?.conectado

  // El selector de Página se come la tarjeta mientras está abierto: es una
  // decisión que hay que tomar antes de seguir, y mostrarla al lado del estado
  // anterior invita a leer el estado viejo como si fuera el nuevo.
  if (paginas.length > 0) {
    return (
      <Marco className={className}>
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          Administrás varias Páginas. Elegí cuál querés atender desde el CRM.
        </p>
        <ul className="mt-3 space-y-1.5">
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
        <Button variant="ghost" size="sm" className="mt-3" onClick={cancelarSeleccion} disabled={conectando}>
          Cancelar
        </Button>
        {error && (
          <p className="mt-4 rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
            {error}
          </p>
        )}
      </Marco>
    )
  }

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
            Conectá tu Página de Facebook para recibir en el CRM los mensajes de Messenger y los
            mensajes directos de Instagram. Se abre una ventana de Meta: tu contraseña no pasa por
            acá.
          </p>
          <Button onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar Instagram y Messenger'}
          </Button>
        </div>
      )}

      {conectado && (
        <div className="space-y-4">
          {/* Si el token dejó de servir, la Página sigue en la base pero no
              entra ni sale nada. Vale más decirlo acá que dejar que se note
              como "no me llegan los mensajes". */}
          {!estado.vigente && estado.error && (
            <p className="rounded-lg border border-status-critical/25 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">
              {estado.error} — volvé a conectar la Página.
            </p>
          )}

          <div className="divide-y divide-tint/[0.06] border-y border-tint/[0.06]">
            {estado.pageName && <Dato label="Página">{estado.pageName}</Dato>}
            <Dato label="Page ID">{estado.pageId}</Dato>
            {/* Sin cuenta de Instagram, Messenger igual funciona. Se dice con
                todas las letras porque si no, la ausencia se lee como un error
                de la conexión entera. */}
            <Dato label="Instagram">
              {estado.igUsername ? `@${estado.igUsername}` : 'no asociado'}
            </Dato>
            {estado.igAccountId && <Dato label="Instagram ID">{estado.igAccountId}</Dato>}
          </div>

          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? 'Conectando…' : 'Conectar otra Página'}
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
