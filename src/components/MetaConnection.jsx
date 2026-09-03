import Button from './ui/Button'
import { SkeletonLinea } from './ui/Skeleton'
import Switch from './ui/Switch'
import ChannelCard, { AvisoCanal, Dato, DatosConexion, EstadoCanal } from './ui/ChannelCard'
import ChannelLogo from './ui/ChannelLogo'
import { IconCheck } from './ui/icons'
import { useMetaConnection } from '../hooks/useMetaConnection'
import { useT } from '../lib/i18n.jsx'

// El violeta de Instagram, que es el que domina las dos marcas puestas juntas.
// Literal, como el verde de WhatsApp: es de Meta, no de nuestra paleta.
const TONO = 'rgba(150, 47, 191, 0.11)'

// La marca de esta tarjeta son dos: es un solo trámite que engancha dos
// canales, y un logo solo dejaría afuera al otro. Van uno al lado del otro y no
// superpuestos como en un avatar: estos archivos no traen contorno blanco, así
// que encimados el círculo de Messenger se comería la esquina de Instagram.
function Marcas() {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <ChannelLogo channel="messenger" size={24} />
      <ChannelLogo channel="instagram" size={24} />
    </span>
  )
}

function Marco({ className = '', descripcion, subtitulo, distintivo, acciones, children }) {
  return (
    <ChannelCard
      className={className}
      tono={TONO}
      marca={<Marcas />}
      titulo="Instagram y Messenger"
      subtitulo={subtitulo}
      descripcion={descripcion}
      distintivo={distintivo}
      acciones={acciones}
    >
      {children}
    </ChannelCard>
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
  const t = useT()

  // Estas dos tarjetas son de las que más tardan: cada una le pregunta a Graph
  // por el estado del token antes de poder decir nada. Un "Cargando…" suelto
  // deja la tarjeta con un renglón de alto, así que al llegar la respuesta la
  // columna entera salta hacia abajo. El hueco mide lo mismo que el contenido.
  if (cargando) {
    return (
      <Marco className={className}>
        <div role="status" aria-label={t('canales.consultandoEstado')}>
          <SkeletonLinea className="h-2.5 w-[62%]" />
          <SkeletonLinea className="mt-4 h-7 w-32 rounded-lg" />
        </div>
      </Marco>
    )
  }

  // Si no se pudo leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" manda a revisar variables que
  // suelen estar perfectas.
  if (!config) {
    return (
      <Marco className={className}>
        <AvisoCanal detalle={error}>{t('canales.noSePudoConsultar')}</AvisoCanal>
      </Marco>
    )
  }

  // Instagram y Messenger no usan config_id: no son Embedded Signup. Por eso
  // esta tarjeta puede estar disponible aunque la de WhatsApp diga que falta.
  if (!config.metaConfigurado) {
    return (
      <Marco className={className} distintivo={<EstadoCanal>{t('canales.sinConfigurar')}</EstadoCanal>}>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          {t('canales.cargaAntes')}
          <code className="text-ink-secondary">META_APP_ID</code> +{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code>
          {t('canales.cargaEn')}
          <code className="text-ink-secondary">server/.env</code>.
        </p>
      </Marco>
    )
  }

  const problemas =
    error || avisos.length > 0 ? (
      <div className="space-y-1.5">
        {error && <AvisoCanal>{error}</AvisoCanal>}
        {avisos.map((aviso) => (
          <p
            key={aviso}
            className="rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[11.5px] leading-snug text-ink-muted"
          >
            {aviso}
          </p>
        ))}
      </div>
    ) : null

  // El selector de Página se come la tarjeta mientras está abierto: es una
  // decisión que hay que tomar antes de seguir, y mostrarla al lado del estado
  // anterior invita a leer el estado viejo como si fuera el nuevo.
  if (paginas.length > 0) {
    return (
      <Marco
        className={className}
        descripcion={t('canales.variasPaginas')}
        acciones={
          <Button variant="ghost" size="sm" onClick={cancelarSeleccion} disabled={conectando}>
            {t('comun.cancelar')}
          </Button>
        }
      >
        <ul className="space-y-1.5">
          {paginas.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => conectarPagina(p.id)}
                disabled={conectando}
                className="w-full rounded-lg border border-tint/10 bg-tint/[0.04] px-3 py-2 text-left transition-colors duration-200 hover:bg-tint/[0.09] disabled:opacity-50"
              >
                <span className="block text-[12.5px] font-medium text-ink-primary">{p.nombre}</span>
                <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                  {p.igUsername ? `@${p.igUsername}` : t('canales.sinInstagramAsociado')}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {error && (
          <div className="mt-3">
            <AvisoCanal>{error}</AvisoCanal>
          </div>
        )}
      </Marco>
    )
  }

  const conectado = estado?.conectado

  if (!conectado) {
    return (
      <Marco
        className={className}
        descripcion={`${t('canales.metaBajada')} ${t('canales.ventanaDeMeta')}`}
        acciones={
          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? t('canales.conectando') : t('comun.conectar')}
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
      subtitulo={estado.pageName || t('canales.paginaNumero', { id: estado.pageId })}
      distintivo={
        estado.vigente ? (
          <EstadoCanal tono="conectado">
            <IconCheck size={11} />
            {t('comun.conectado')}
          </EstadoCanal>
        ) : (
          // No dice "Token vencido": los tokens de Página sacados con un token
          // de usuario largo no vencen. Si Graph deja de aceptarlo es porque se
          // revocó el acceso, y nombrarlo "vencido" mandaba a buscar una
          // renovación que no existe.
          <EstadoCanal tono="problema">{t('canales.sinAcceso')}</EstadoCanal>
        )
      }
      acciones={
        <>
          <Button variant="ghost" size="sm" onClick={refrescar}>
            {t('comun.actualizar')}
          </Button>
          <Button variant="secondary" size="sm" onClick={conectar} disabled={!sdkListo || conectando}>
            {conectando ? t('canales.conectando') : t('canales.conectarOtraPagina')}
          </Button>
        </>
      }
    >
      {/* Si el token dejó de servir, la Página sigue en la base pero no entra
          ni sale nada. Vale más decirlo acá que dejar que se note como "no me
          llegan los mensajes". El texto crudo de Graph va en el `title`. */}
      {!estado.vigente && (
        <AvisoCanal detalle={estado.error}>{t('canales.sinAccesoAviso')}</AvisoCanal>
      )}

      {/* Los dos interruptores son lo único que el negocio decide acá: la
          conexión es una sola porque Meta entrega un token que cubre los dos
          canales, y lo que se elige es cuál atiende el CRM.

          La pista de cada uno es la cuenta y nada más. Decía "Contestar los
          mensajes directos de @…" y "Contestar los mensajes de la Página X",
          que es la misma frase dos veces arriba del renglón que ya dice de qué
          canal se trata. La frase entera quedó en el `title`. */}
      <div className="space-y-1.5">
        <Switch
          label="Instagram"
          hint={estado.igUsername ? `@${estado.igUsername}` : t('canales.sinCuentaAsociada')}
          title={t('canales.instagramTitle')}
          checked={Boolean(estado.canales?.instagram) && Boolean(estado.igAccountId)}
          // Sin cuenta asociada no hay nada que prender: dejarlo activable
          // sería ofrecer atender un canal que no existe.
          disabled={!estado.igAccountId}
          onChange={(v) => cambiarCanal('instagram', v)}
        />
        <Switch
          label="Messenger"
          hint={estado.pageName || t('canales.paginaDeFacebook')}
          title={t('canales.messengerTitle')}
          checked={Boolean(estado.canales?.messenger)}
          onChange={(v) => cambiarCanal('messenger', v)}
        />
      </div>

      {/* Lo único que queda del párrafo que había abajo de los interruptores:
          apagar no desconecta nada del lado de Meta, y confundir las dos cosas
          es lo que haría que alguien apague creyendo que cierra el canal. */}
      <p className="mt-2 text-[11px] leading-snug text-ink-faint">
        {t('canales.apagarNoDesconecta')}
      </p>

      <DatosConexion>
        <Dato label="Page ID">{estado.pageId}</Dato>
        {estado.igAccountId && <Dato label="Instagram ID">{estado.igAccountId}</Dato>}
      </DatosConexion>

      {problemas && <div className="mt-3">{problemas}</div>}
    </Marco>
  )
}
