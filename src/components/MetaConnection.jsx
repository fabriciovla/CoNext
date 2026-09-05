import { useState } from 'react'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { SkeletonLinea } from './ui/Skeleton'
import ChannelCard, {
  AvisoCanal,
  Dato,
  DatosConexion,
  FilaEstado,
  MenuCanal,
} from './ui/ChannelCard'
import ChannelLogo from './ui/ChannelLogo'
import { useMetaConnection } from '../hooks/useMetaConnection'
import { useT } from '../lib/i18n.jsx'

// El violeta de Instagram, que es el que domina las dos marcas puestas juntas.
// Literal, como el verde de WhatsApp: es de Meta, no de nuestra paleta.
const TONO = 'rgba(150, 47, 191, 0.11)'

// La marca de esta tarjeta son dos: es un solo trámite que engancha dos
// canales, y un logo solo dejaría afuera al otro.
//
// Van **encimados y no uno al lado del otro**: separados son dos cosas, y esto
// es una sola conexión con dos caras. Lo que hace posible encimarlos es el aro
// del color de la tarjeta que lleva el de adelante: los archivos no traen
// contorno, y pegados a secas Messenger se comería la esquina de Instagram.
//
// El aro son cuatro `drop-shadow` sin desenfoque, uno por lado, y **no un fondo
// abajo de la imagen**. Un fondo es un rectángulo —redondeado o no— y las dos
// marcas no tienen la misma silueta: la de Messenger es un globo redondo con
// cola, así que atrás de él un cuadrado redondeado asomaba por las cuatro
// esquinas como un marco blanco. `drop-shadow` sigue el alfa del archivo, así
// que el aro le calca la forma sin que acá haya que saber cuál es.
const ARO = 'rgb(var(--surface-card))'
const CONTORNO = {
  filter: [
    `drop-shadow(1.5px 0 0 ${ARO})`,
    `drop-shadow(-1.5px 0 0 ${ARO})`,
    `drop-shadow(0 1.5px 0 ${ARO})`,
    `drop-shadow(0 -1.5px 0 ${ARO})`,
  ].join(' '),
}

function Marcas() {
  return (
    <span className="flex shrink-0 items-center">
      <ChannelLogo channel="instagram" size={38} />
      <span className="-ml-2.5" style={CONTORNO}>
        <ChannelLogo channel="messenger" size={38} />
      </span>
    </span>
  )
}

function Marco({ className = '', descripcion, subtitulo, estado, menu, accion, children }) {
  return (
    <ChannelCard
      className={className}
      tono={TONO}
      marca={<Marcas />}
      titulo="Instagram y Messenger"
      subtitulo={subtitulo}
      descripcion={descripcion}
      estado={estado}
      menu={menu}
      accion={accion}
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
    desconectar,
    refrescar,
  } = useMetaConnection()
  const t = useT()
  const [confirmar, setConfirmar] = useState(false)

  // Estas dos tarjetas son de las que más tardan: cada una le pregunta a Graph
  // por el estado del token antes de poder decir nada. Un "Cargando…" suelto
  // deja la tarjeta con un renglón de alto, así que al llegar la respuesta la
  // columna entera salta hacia abajo. El hueco mide lo mismo que el contenido.
  if (cargando) {
    return (
      <Marco className={className}>
        <div role="status" aria-label={t('canales.consultandoEstado')}>
          <SkeletonLinea className="h-2.5 w-[62%]" />
          <SkeletonLinea className="mt-4 h-8 w-full rounded-lg" />
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
      <Marco
        className={className}
        subtitulo={t('canales.sinConectar')}
        estado={<FilaEstado>{t('canales.sinConfigurar')}</FilaEstado>}
      >
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
        accion={
          <Button variant="secondary" onClick={cancelarSeleccion} disabled={conectando} className="w-full">
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
        subtitulo={t('canales.sinConectar')}
        descripcion={`${t('canales.metaBajada')} ${t('canales.ventanaDeMeta')}`}
        accion={
          <Button
            variant="primary"
            onClick={conectar}
            disabled={!sdkListo || conectando}
            className="w-full"
          >
            {conectando ? t('canales.conectando') : t('comun.conectar')}
          </Button>
        }
      >
        {problemas}
      </Marco>
    )
  }

  const instagramActivo = Boolean(estado.canales?.instagram) && Boolean(estado.igAccountId)
  const messengerActivo = Boolean(estado.canales?.messenger)
  const activos = [instagramActivo, messengerActivo].filter(Boolean).length

  return (
    <Marco
      className={className}
      subtitulo={estado.pageName || t('canales.paginaNumero', { id: estado.pageId })}
      estado={
        estado.vigente ? (
          // El detalle de la derecha es cuántas caras están atendiendo. Es el
          // equivalente de la calidad del número en la otra tarjeta: dice si el
          // canal, además de conectado, está haciendo algo. Con los dos
          // interruptores apagados la conexión sigue viva y no entra un mensaje,
          // que es justo el caso que sin esto no se ve.
          <FilaEstado tono="conectado" detalle={t('canales.canalesActivos', { n: activos })}>
            {t('comun.conectado')}
          </FilaEstado>
        ) : (
          // No dice "Token vencido": los tokens de Página sacados con un token
          // de usuario largo no vencen. Si Graph deja de aceptarlo es porque se
          // revocó el acceso, y nombrarlo "vencido" mandaba a buscar una
          // renovación que no existe.
          <FilaEstado tono="problema">{t('canales.sinAcceso')}</FilaEstado>
        )
      }
      menu={
        // Los dos interruptores son lo único que el negocio decide acá: la
        // conexión es una sola porque Meta entrega un token que cubre los dos
        // canales, y lo que se elige es cuál atiende el CRM. Van adentro del
        // menú y no en el cuerpo de la tarjeta para que las dos fichas de
        // Canales tengan la misma forma —logo, estado, detalles— y no una el
        // doble de alta que la otra; cuántos quedaron encendidos lo dice la
        // fila de estado, que es la pregunta que la tarjeta tiene que contestar
        // sin abrir nada.
        //
        // La pista de cada uno es la cuenta y nada más: decía "Contestar los
        // mensajes directos de @…", que es la misma frase que ya dice el
        // nombre del canal. La frase entera quedó en el `title`.
        <MenuCanal
          ariaLabel={t('canales.menuMeta')}
          nota={t('canales.apagarNoDesconecta')}
          items={[
            {
              label: 'Instagram',
              hint: estado.igUsername ? `@${estado.igUsername}` : t('canales.sinCuentaAsociada'),
              title: t('canales.instagramTitle'),
              checked: instagramActivo,
              // Sin cuenta asociada no hay nada que prender: dejarlo activable
              // sería ofrecer atender un canal que no existe.
              disabled: !estado.igAccountId,
              onClick: () => cambiarCanal('instagram', !instagramActivo),
            },
            {
              label: 'Messenger',
              hint: estado.pageName || t('canales.paginaDeFacebook'),
              title: t('canales.messengerTitle'),
              checked: messengerActivo,
              onClick: () => cambiarCanal('messenger', !messengerActivo),
            },
            { separador: true },
            { label: t('comun.actualizar'), onClick: refrescar },
            {
              label: t('canales.conectarOtraPagina'),
              onClick: conectar,
              disabled: !sdkListo || conectando,
            },
            { label: t('comun.desconectar'), onClick: () => setConfirmar(true), peligro: true },
          ]}
        />
      }
    >
      {/* Si el token dejó de servir, la Página sigue en la base pero no entra
          ni sale nada. Vale más decirlo acá que dejar que se note como "no me
          llegan los mensajes". El texto crudo de Graph va en el `title`. */}
      {!estado.vigente && (
        <div className="mb-3">
          <AvisoCanal detalle={estado.error}>{t('canales.sinAccesoAviso')}</AvisoCanal>
        </div>
      )}

      <DatosConexion>
        <Dato label="Page ID" copiable>
          {estado.pageId}
        </Dato>
        {estado.igAccountId && (
          <Dato label="Instagram ID" copiable>
            {estado.igAccountId}
          </Dato>
        )}
      </DatosConexion>

      {problemas && <div className="mt-3">{problemas}</div>}

      {/* La conexión es una sola para los dos canales, así que el modal lo dice
          con todas las letras: desconectar acá apaga Instagram y Messenger. */}
      {confirmar && (
        <Modal title={t('canales.desconectarMetaTitulo')} onClose={() => setConfirmar(false)}>
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            {t('canales.desconectarMetaTexto')}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmar(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await desconectar()
                setConfirmar(false)
              }}
            >
              {t('comun.desconectar')}
            </Button>
          </div>
        </Modal>
      )}
    </Marco>
  )
}
