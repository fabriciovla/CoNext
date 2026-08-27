import Avatar from '../ui/Avatar'
import FormattedText from '../ui/FormattedText'
import { IconBolt, IconDoubleCheck, IconDownload, IconFile } from '../ui/icons'
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
      <span className="block rounded-xl border border-tint/10 bg-tint/[0.04] px-3 py-2 text-[13px] text-ink-muted">
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
      className="flex items-center gap-2.5 rounded-xl border border-tint/10 bg-tint/[0.04] px-3 py-2 transition-colors duration-200 hover:bg-tint/[0.08]"
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

// La hora va adentro del globo, abajo a la derecha, como en cualquier chat.
// Flota en vez de ser una línea propia: si la última línea del mensaje deja
// lugar, la hora entra ahí, y solo baja sola cuando no entra. Como bloque
// aparte le sumaba un renglón a cada uno de los mensajes del hilo.
function Hora({ iso }) {
  return (
    <span className="float-right ml-3 mt-[7px] select-none text-[11px] leading-none tabular-nums text-ink-faint">
      {formatTime(iso)}
    </span>
  )
}

export default function MessageBubble({ message, customer, agentName, fromEnd = 0 }) {
  const delay = { '--d': `${Math.min(fromEnd, 8) * 40}ms` }

  // Evento del sistema: una línea centrada, sin globo. No es algo que alguien
  // haya dicho, así que no se le da la forma de un mensaje.
  if (message.direction === 'evento') {
    return (
      <li className="animate-fade-in flex justify-center py-1" style={delay}>
        <span className="px-3 text-center text-[11.5px] text-ink-faint">{renderStrong(message.text)}</span>
      </li>
    )
  }

  // Nota interna: el cliente nunca la ve, así que se sale del esquema
  // izquierda/derecha y usa el ámbar de "atención" con su propia etiqueta.
  if (message.direction === 'nota') {
    return (
      <li className="animate-fade-left flex justify-end" style={delay}>
        <div className="flex max-w-[min(78%,30rem)] flex-col items-end">
          <div className="rounded-2xl rounded-br-md border border-status-warning/25 bg-status-warning/[0.09] px-4 py-2.5">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-primary">
              <FormattedText>{message.text}</FormattedText>
              <Hora iso={message.createdAt} />
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 px-1 text-[11.5px] text-ink-faint">
            <span className="text-status-warning">Nota interna</span>
          </div>
        </div>
      </li>
    )
  }

  const isOut = message.direction === 'out'
  const isPending = message.direction === 'in' && message.status === 'pendiente'
  const isBot = isOut && message.author === 'bot'

  // Estado de entrega que manda Meta por el webhook. Sin novedades todavía
  // (o mensajes viejos, anteriores a que esto existiera) queda tenue: decimos
  // "salió", no "llegó", que es lo único que sabemos en ese momento.
  const entrega = message.deliveryStatus ?? null
  const falloEnvio = entrega === 'failed'
  const tonoTilde =
    entrega === 'read' ? 'text-violet' : entrega === 'delivered' ? 'text-ink-muted' : 'text-ink-faint'
  const textoEntrega = { sent: 'Enviado', delivered: 'Entregado', read: 'Leído' }[entrega]

  return (
    // Cada globo entra desde su lado del hilo, y el retraso se cuenta desde el
    // final: el último aparece sin espera (es lo que importa al enviar uno
    // nuevo) y los de arriba lo siguen.
    //
    // La fila del globo y la línea de datos son hermanas, no van anidadas: así
    // el avatar se apoya en la base del globo y no en la del bloque entero,
    // que lo dejaría flotando debajo de la hora.
    <li
      className={`flex flex-col ${isOut ? 'animate-fade-left items-end' : 'animate-fade-right items-start'}`}
      style={delay}
    >
      {/* Columna de lectura angosta a propósito: el globo no pasa de 30rem por
          más ancho que tenga el panel. Con el texto en 15px, una línea más larga
          que esto obliga a barrer la pantalla con la vista para leer un mensaje
          de dos renglones. */}
      <div className="flex max-w-[min(78%,30rem)] items-end gap-2">
        {!isOut && <Avatar photo name={customer} size={28} className="!rounded-full" />}

        {/* La tilde va afuera del globo, a su izquierda, como en la referencia:
            el estado de entrega se lee en la misma columna en todos los mensajes. */}
        {isOut &&
          (falloEnvio ? (
            <span
              title={message.deliveryError ?? 'No se pudo entregar'}
              className="mb-1 flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border border-status-critical text-[9px] font-bold leading-none text-status-critical"
            >
              !
            </span>
          ) : (
            // El tooltip va en el span y no en el <svg>: como atributo del SVG
            // no lo muestra el navegador.
            <span title={textoEntrega ?? 'Enviado'} className="mb-1 flex shrink-0">
              <IconDoubleCheck size={13} className={`transition-colors duration-300 ${tonoTilde}`} />
            </span>
          ))}

        <div
          className={`min-w-0 rounded-2xl border px-4 py-2.5 transition-colors duration-300 ${
            isOut
              ? 'rounded-br-md border-violet/25 bg-violet-soft'
              : isPending
                ? 'rounded-bl-md border-status-warning/25 bg-status-warning/[0.07]'
                : 'rounded-bl-md border-tint/[0.07] bg-tint/[0.055]'
          }`}
        >
          {message.mediaKind && (
            <div className={message.text ? 'mb-2' : ''}>
              <Adjunto message={message} />
            </div>
          )}

          {/* Un adjunto sin epígrafe no arrastra un párrafo vacío, pero la hora
              tiene que salir igual: en ese caso va sola en su renglón. */}
          {message.text ? (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-primary">
              <FormattedText>{message.text}</FormattedText>
              <Hora iso={message.createdAt} />
            </p>
          ) : (
            <p className="mt-1.5 text-right text-[11px] leading-none tabular-nums text-ink-faint">
              {formatTime(message.createdAt)}
            </p>
          )}
        </div>

        {isOut && (
          <Avatar
            name={isBot ? 'Bot' : 'Admin'}
            size={28}
            className={`!rounded-full !text-[10px] ${isBot ? '!border-violet/30 !bg-violet-soft' : ''}`}
          />
        )}
      </div>

      {/* Alineada con el globo, no con el avatar: el margen equivale al ancho
          del avatar más su separación (28px + 8px de gap = 36px = 9).
          La hora ya no vive acá — se mudó adentro del globo —, así que esta
          línea solo aparece cuando de verdad hay algo que decir; si no, cada
          mensaje arrastraba un renglón vacío. */}
      {(isBot || isPending || falloEnvio) && (
        <div
          className={`mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-faint ${isOut ? 'mr-9' : 'ml-9'}`}
        >
          {isBot && (
            <>
              <IconBolt size={11} />
              <span>{agentName}</span>
            </>
          )}
          {isPending && <span className="text-status-warning">Pendiente</span>}
          {/* Un envío fallido se dice con todas las letras: es el caso en que el
              cliente no recibió nada y, sin esto, la conversación se ve igual
              que una contestada. */}
          {falloEnvio && (
            <>
              {isBot && <span aria-hidden="true">·</span>}
              <span className="text-status-critical">
                No se entregó{message.deliveryError ? ` (${message.deliveryError})` : ''}
              </span>
            </>
          )}
        </div>
      )}
    </li>
  )
}
