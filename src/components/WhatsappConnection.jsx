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
import { useWhatsappConnection } from '../hooks/useWhatsappConnection'
import { useT } from '../lib/i18n.jsx'

// El verde de WhatsApp, apenas insinuado detrás del logo. Es el mismo literal
// que usa la marca: no sale de la paleta semántica y no cambia entre temas.
const TONO = 'rgba(37, 211, 102, 0.11)'

// Lo que devuelve Graph en `quality_rating`. Se traduce acá y no se muestra
// crudo: "GREEN" al lado del estado se lee como un código de error, no como
// "el número está sano". Cualquier otro valor (UNKNOWN, NA) no dice nada, así
// que no se dibuja: media frase inventada es peor que el hueco.
const CALIDAD = {
  GREEN: 'canales.calidadAlta',
  YELLOW: 'canales.calidadMedia',
  RED: 'canales.calidadBaja',
}

function Marco({ className = '', descripcion, subtitulo, estado, menu, accion, children }) {
  return (
    <ChannelCard
      className={className}
      tono={TONO}
      marca={<ChannelLogo channel="whatsapp" size={38} />}
      titulo="WhatsApp Business"
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

export default function WhatsappConnection({ className = '' }) {
  const t = useT()
  const { config, estado, cargando, conectando, error, avisos, sdkListo, conectar, desconectar, refrescar } =
    useWhatsappConnection()
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

  // Si no se pudo ni leer la config, el problema está antes: el server no
  // responde. Decir "falta configurar el .env" acá manda a revisar variables que
  // suelen estar perfectas — el .env no se puede leer si nadie contesta.
  if (!config) {
    return (
      <Marco className={className}>
        <AvisoCanal detalle={error}>{t('canales.noSePudoConsultar')}</AvisoCanal>
      </Marco>
    )
  }

  // Sin las variables del .env el botón abriría un popup que falla con un error
  // de Meta que no explica nada. Mejor decir qué falta.
  if (!config.configurado) {
    return (
      <Marco
        className={className}
        subtitulo={t('canales.sinConectar')}
        estado={<FilaEstado>{t('canales.sinConfigurar')}</FilaEstado>}
      >
        <p className="text-[12px] leading-relaxed text-ink-muted">
          {t('canales.cargaAntes')}
          <code className="text-ink-secondary">META_APP_ID</code>,{' '}
          <code className="text-ink-secondary">META_CONFIG_ID</code> y{' '}
          <code className="text-ink-secondary">META_APP_SECRET</code>
          {t('canales.cargaEn')}
          <code className="text-ink-secondary">server/.env</code>.
        </p>
      </Marco>
    )
  }

  const conectado = estado?.conectado

  const problemas =
    error || avisos.length > 0 ? (
      <div className="space-y-1.5">
        {error && <AvisoCanal>{error}</AvisoCanal>}
        {avisos.map((aviso) => (
          <p
            key={aviso}
            className="rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[11.5px] leading-snug text-ink-muted"
          >
            {/* Los avisos los redacta el server (vienen en la respuesta de
                /whatsapp/status), asi que salen en el idioma del server y no
                pasan por el diccionario. */}
            {aviso}
          </p>
        ))}
      </div>
    ) : null

  // Desconectado no hay nada que mirar ni nada que decidir: la tarjeta explica
  // qué se está por enganchar y ofrece el único botón que tiene sentido, sólido
  // y a todo el ancho. Sin fila de estado: "Sin conectar" ya está abajo del
  // título, y repetirlo en una fila propia es decirlo dos veces en tres
  // centímetros.
  if (!conectado) {
    return (
      <Marco
        className={className}
        subtitulo={t('canales.sinConectar')}
        descripcion={`${t('canales.whatsappBajada')} ${t('canales.ventanaDeMeta')}`}
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

  const calidad = CALIDAD[estado.calidad] ? t(CALIDAD[estado.calidad]) : null

  return (
    <Marco
      className={className}
      // El número, solo si Graph lo devolvió. Con el token caído no viene, y
      // poner ahí el phone_number_id es un renglón de dígitos justo donde se
      // busca a qué número está enganchado: el id ya vive plegado abajo.
      subtitulo={estado.numero || estado.nombre}
      estado={
        estado.vigente ? (
          <FilaEstado tono="conectado" detalle={calidad}>
            {t('comun.conectado')}
          </FilaEstado>
        ) : (
          <FilaEstado tono="problema">{t('canales.tokenVencido')}</FilaEstado>
        )
      }
      menu={
        <MenuCanal
          ariaLabel={t('canales.menuWhatsapp')}
          items={[
            { label: t('comun.actualizar'), onClick: refrescar },
            {
              label: t('canales.conectarOtroNumero'),
              onClick: conectar,
              disabled: !sdkListo || conectando,
            },
            { label: t('comun.desconectar'), onClick: () => setConfirmar(true), peligro: true },
          ]}
        />
      }
    >
      {/* Si el token dejó de servir, el número sigue en la base pero no entra
          ni sale nada. Vale más decirlo acá que dejar que se note como "no me
          llegan los mensajes". El texto de Meta va en el `title`. */}
      {!estado.vigente && (
        <div className="mb-3">
          <AvisoCanal detalle={estado.error}>{t('canales.tokenVencidoAviso')}</AvisoCanal>
        </div>
      )}

      <DatosConexion>
        {estado.nombre && <Dato label={t('canales.datoNombre')}>{estado.nombre}</Dato>}
        <Dato label="Phone number ID" copiable>
          {estado.phoneNumberId}
        </Dato>
        {estado.wabaId && (
          <Dato label="WABA ID" copiable>
            {estado.wabaId}
          </Dato>
        )}
      </DatosConexion>

      {problemas && <div className="mt-3">{problemas}</div>}

      {/* Desconectar es destructivo: deja de entrar y de salir todo por este
          canal. Como cualquier destructiva de la app, pregunta antes. */}
      {confirmar && (
        <Modal title={t('canales.desconectarWaTitulo')} onClose={() => setConfirmar(false)}>
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            {t('canales.desconectarWaTexto')}
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
