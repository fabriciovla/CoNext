import FormattedText from '../ui/FormattedText'
import { IconBolt, IconDoubleCheck, IconDownload, IconFile, IconNote } from '../ui/icons'
import useMediaSrc from '../../hooks/useMediaSrc'
import { formatTime } from '../../utils/time'

function pesoLegible(bytes) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// El adjunto de un mensaje. La imagen y el video se ven en el hilo, el audio
// trae el reproductor del navegador y cualquier otra cosa es una fila para
// descargar: no tiene sentido pelear con la vista previa de un PDF adentro de
// un globo de 30rem.
function Adjunto({ message }) {
  const { src, error } = useMediaSrc(message.id)
  const nombre = message.mediaName || 'archivo'

  if (error) {
    return (
      <span className="block rounded-xl bg-tint/[0.06] px-3 py-2 text-[13px] text-ink-muted">
        No se pudo abrir el adjunto
      </span>
    )
  }

  // Mientras baja hay un rectángulo del alto de la burbuja: sin él la lista
  // salta cuando cada archivo termina de llegar.
  if (!src) {
    return <span className="block h-16 w-40 animate-pulse rounded-xl bg-tint/[0.06]" />
  }

  if (message.mediaKind === 'image') {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block">
        <img
          src={src}
          alt={nombre}
          // El alto máximo es el que evita que una foto vertical se coma la
          // pantalla entera del hilo.
          className="max-h-72 w-full rounded-xl object-cover"
        />
      </a>
    )
  }

  if (message.mediaKind === 'video') {
    return <video src={src} controls className="max-h-72 w-full rounded-xl" />
  }

  if (message.mediaKind === 'audio') {
    // El reproductor nativo: es el que ya sabe buscar dentro del audio, cambiar
    // la velocidad y usar la salida de audio elegida en el sistema.
    return <audio src={src} controls className="w-[16rem] max-w-full" />
  }

  return (
    <a
      href={src}
      download={nombre}
      className="flex items-center gap-2.5 rounded-xl bg-tint/[0.06] px-3 py-2 transition-colors duration-200 hover:bg-tint/[0.1]"
    >
      <IconFile size={20} className="shrink-0 text-ink-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink-primary">{nombre}</span>
        {pesoLegible(message.mediaSize) && (
          <span className="block text-[11.5px] text-ink-faint">{pesoLegible(message.mediaSize)}</span>
        )}
      </span>
      <IconDownload size={16} className="shrink-0 text-ink-muted" />
    </a>
  )
}

// El texto de los eventos permite **negrita** para resaltar lo único que
// importa leer de esa línea (quién pasó a atender, por ejemplo).
function renderStrong(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink-secondary">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

// El pie del globo: el rayo de "lo contestó un agente", la hora y, si el
// mensaje salió de acá, el acuse de entrega.
//
// Los tres van juntos y adentro del globo, que es donde los pone cualquier
// chat. La tilde estaba suelta a la izquierda del globo, flotando contra nada:
// ahí no se lee como "este mensaje llegó", se lee como un glifo perdido. Y el
// agente era un renglón entero —"⚡ Agente de ventas"— colgado abajo de cada
// respuesta automática: en un hilo donde el bot contesta seis veces, la
// pantalla decía seis veces lo mismo que ya dice la ficha de la derecha. Como
// rayo suelto sigue estando en todos los mensajes, que es lo que hace falta
// para no confundir lo que escribió una persona con lo que escribió el bot, y
// el nombre queda a un hover.
//
// Flota en vez de ser una línea propia: si la última línea del mensaje deja
// lugar, entra ahí, y solo baja solo cuando no entra. Como bloque aparte le
// sumaba un renglón a cada uno de los mensajes del hilo.
function PieDelGlobo({ message, isOut, agentName = null }) {
  const entrega = message.deliveryStatus ?? null
  const fallo = entrega === 'failed'
  // Tres escalones para tres estados. Sin novedades todavía (o mensajes viejos,
  // anteriores a que esto existiera) queda en el más tenue de los tres: decimos
  // "salió", no "llegó", que es lo único que sabemos en ese momento.
  //
  // El piso es `ink-muted` y no `ink-faint`: acá el fondo no es la página sino
  // el globo, y sobre el violeta apagado del tema oscuro el nivel más tenue de
  // la escala se queda en 3,2:1 — está calibrado contra `surface-*`, no contra
  // esto.
  const tono =
    entrega === 'read'
      ? 'text-violet'
      : entrega === 'delivered'
        ? 'text-ink-secondary'
        : 'text-ink-muted'
  const rotulo = { sent: 'Enviado', delivered: 'Entregado', read: 'Leído' }[entrega]

  return (
    <span className="float-right ml-2.5 mt-[5px] flex select-none items-center gap-1 leading-none">
      {agentName && (
        <span title={`Respondió ${agentName}`} className="flex text-ink-muted">
          <IconBolt size={11} />
        </span>
      )}
      <span className="text-[11px] tabular-nums text-ink-muted">{formatTime(message.createdAt)}</span>
      {isOut &&
        (fallo ? (
          <span
            title={message.deliveryError ?? 'No se pudo entregar'}
            className="flex h-[12px] w-[12px] items-center justify-center rounded-full border border-status-critical text-[8px] font-bold leading-none text-status-critical"
          >
            !
          </span>
        ) : (
          // El tooltip va en el span y no en el <svg>: como atributo del SVG
          // no lo muestra el navegador.
          <span title={rotulo ?? 'Enviado'} className="flex">
            <IconDoubleCheck size={13} className={`transition-colors duration-300 ${tono}`} />
          </span>
        ))}
    </span>
  )
}

// Un mensaje del hilo.
//
// `primero` y `ultimo` son la posición dentro del bloque: los mensajes seguidos
// del mismo autor se agrupan (los calcula ChatPanel). Lo que se dice una vez
// por bloque y no una vez por mensaje se cuelga de `primero`, y la esquina
// corta del globo —la "colita"— de `ultimo`. Sin eso, tres mensajes seguidos
// del cliente son tres bloques idénticos separados por el mismo aire, y hay que
// leer las horas para darse cuenta de que fue una sola andanada.
export default function MessageBubble({ message, agentName, primero = true, ultimo = true }) {
  // Entre mensajes del mismo bloque casi no hay aire; entre bloques sí. Es la
  // separación la que dice "acá arrancó otra cosa", no una línea ni un rótulo.
  const separacion = primero ? 'mt-3' : 'mt-[3px]'

  // Evento del sistema: una línea centrada, sin globo. No es algo que alguien
  // haya dicho, así que no se le da la forma de un mensaje.
  if (message.direction === 'evento') {
    return (
      <li className={`${separacion} flex justify-center`}>
        <span className="px-3 text-center text-[11.5px] text-ink-faint">{renderStrong(message.text)}</span>
      </li>
    )
  }

  // Nota interna: el cliente nunca la ve, así que se sale del esquema
  // izquierda/derecha y usa el ámbar de "atención" con su propia etiqueta.
  //
  // Es lo único del hilo que conserva el borde. Los globos lo perdieron porque
  // un globo con contorno se lee como una tarjeta; acá el contorno es
  // justamente el punto, porque la nota no es un mensaje: es algo pegado al
  // costado de la conversación.
  if (message.direction === 'nota') {
    return (
      <li className={`flex flex-col items-end ${separacion}`}>
        {primero && (
          <span className="mb-1 flex items-center gap-1 px-1 text-[11px] text-status-warning">
            <IconNote size={11} />
            Nota interna
          </span>
        )}
        <div
          className={`max-w-[min(78%,30rem)] rounded-2xl border border-status-warning/30 bg-status-warning/[0.08] px-3.5 py-2 ${
            ultimo ? 'rounded-br-md' : ''
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-ink-primary">
            <FormattedText>{message.text}</FormattedText>
            <PieDelGlobo message={message} isOut={false} />
          </p>
        </div>
      </li>
    )
  }

  const isOut = message.direction === 'out'
  const isBot = isOut && message.author === 'bot'
  // Entrante que todavía nadie atendió. Lo dice el tinte del globo y nada más:
  // la palabra "Pendiente" colgada abajo de cada uno era la tercera copia del
  // mismo dato —la lista ya lo cuenta en la burbuja naranja y la ficha ofrece
  // resolverlos— repetida tantas veces como mensajes seguidos haya escrito el
  // cliente.
  const isPending = message.direction === 'in' && message.status === 'pendiente'
  const fallo = isOut && message.deliveryStatus === 'failed'

  return (
    <li className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} ${separacion}`}>
      {/* Sin avatares. El del contacto era el mismo marcador gris —la Cloud API
          no nos da la foto de perfil— repetido en cada globo de una charla de a
          dos, y sin el nombre al lado, que es lo que lo justifica en la lista;
          el de "Bot"/"Admin" era una letra adentro de un círculo. Con quién
          estás hablando lo dice la ficha de la derecha, que está siempre a la
          vista, y de qué lado está cada globo ya dice quién lo dijo. Es lo
          mismo que hace WhatsApp en una conversación de a dos, que es
          justamente lo que esta pantalla está reflejando.

          Columna de lectura angosta a propósito: el globo no pasa de 30rem por
          más ancho que tenga el panel. Con el texto en 15px, una línea más larga
          que esto obliga a barrer la pantalla con la vista para leer un mensaje
          de dos renglones.

          Sin borde: el relleno solo ya lo separa del fondo en los dos temas, y
          el contorno de 1px es lo que hacía que cada mensaje se leyera como una
          tarjeta apilada en vez de como algo dicho. */}
      <div
        className={`min-w-0 max-w-[min(78%,30rem)] rounded-2xl px-3.5 py-2 transition-colors duration-300 ${
          isOut
            ? `bg-violet-soft ${ultimo ? 'rounded-br-md' : ''}`
            : `${isPending ? 'bg-status-warning/[0.14]' : 'bg-tint/[0.06]'} ${ultimo ? 'rounded-bl-md' : ''}`
        }`}
      >
        {message.mediaKind && (
          <div className={message.text ? 'mb-2' : ''}>
            <Adjunto message={message} />
          </div>
        )}

        {/* Un adjunto sin epígrafe no arrastra un párrafo vacío, pero la hora
            tiene que salir igual: en ese caso va sola en su renglón. El
            `flow-root` es lo que hace que ese renglón contenga al pie flotado,
            que si no se sale del globo. */}
        {message.text ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-ink-primary">
            <FormattedText>{message.text}</FormattedText>
            <PieDelGlobo message={message} isOut={isOut} agentName={isBot ? agentName : null} />
          </p>
        ) : (
          <div className="mt-1.5 flow-root">
            <PieDelGlobo message={message} isOut={isOut} agentName={isBot ? agentName : null} />
          </div>
        )}
      </div>

      {/* Un envío fallido se dice con todas las letras: es el caso en que el
          cliente no recibió nada y, sin esto, la conversación se ve igual que
          una contestada. Es lo único que sigue colgando de un globo suelto,
          porque es de ese mensaje y no del bloque. */}
      {fallo && (
        <p className="mt-1 px-1 text-[11.5px] text-status-critical">
          No se entregó{message.deliveryError ? ` (${message.deliveryError})` : ''}
        </p>
      )}
    </li>
  )
}
