import Avatar from '../ui/Avatar'
import { IconBolt, IconDoubleCheck } from '../ui/icons'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// El texto de los eventos permite **negrita** para resaltar las etapas, que es
// lo único que importa leer de esa línea ("Nuevo lead" → "Lead caliente").
function renderStrong(text) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white/70">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

export default function MessageBubble({ message, customer, agentName, fromEnd = 0 }) {
  const delay = { '--d': `${Math.min(fromEnd, 8) * 40}ms` }

  // Evento del sistema: una línea centrada, sin globo. No es algo que alguien
  // haya dicho, así que no se le da la forma de un mensaje.
  if (message.direction === 'evento') {
    return (
      <li className="animate-fade-in flex justify-center py-1" style={delay}>
        <span className="px-3 text-center text-[11.5px] text-white/35">{renderStrong(message.text)}</span>
      </li>
    )
  }

  // Nota interna: el cliente nunca la ve, así que se sale del esquema
  // izquierda/derecha y usa el ámbar de "atención" con su propia etiqueta.
  if (message.direction === 'nota') {
    return (
      <li className="animate-fade-left flex justify-end" style={delay}>
        <div className="flex max-w-[min(82%,34rem)] flex-col items-end">
          <div className="rounded-2xl rounded-br-md border border-status-warning/25 bg-status-warning/[0.09] px-3.5 py-2.5">
            <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-white/85">
              {message.text}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-white/35">
            <span className="text-status-warning">Nota interna</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </li>
    )
  }

  const isOut = message.direction === 'out'
  const isPending = message.direction === 'in' && message.status === 'pendiente'
  const isBot = isOut && message.author === 'bot'

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
      <div className="flex max-w-[min(80%,36rem)] items-end gap-2">
        {!isOut && <Avatar name={customer} size={26} className="!rounded-full !text-[10px]" />}

        {/* La tilde va afuera del globo, a su izquierda, como en la referencia:
            el estado de entrega se lee en la misma columna en todos los mensajes. */}
        {isOut && <IconDoubleCheck size={13} className="mb-1 shrink-0 text-violet" />}

        <div
          className={`min-w-0 rounded-2xl border px-3.5 py-2.5 transition-colors duration-300 ${
            isOut
              ? 'rounded-br-md border-violet/25 bg-violet-soft'
              : isPending
                ? 'rounded-bl-md border-status-warning/25 bg-status-warning/[0.07]'
                : 'rounded-bl-md border-white/[0.07] bg-white/[0.055]'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-white/90">
            {message.text}
          </p>
        </div>

        {isOut && (
          <Avatar
            name={isBot ? 'Bot' : 'Admin'}
            size={26}
            className={`!rounded-full !text-[10px] ${isBot ? '!border-violet/30 !bg-violet-soft' : ''}`}
          />
        )}
      </div>

      {/* Alineada con el globo, no con el avatar: el margen equivale al ancho
          del avatar más su separación. */}
      <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-white/35 ${isOut ? 'mr-9' : 'ml-9'}`}>
        {isBot && (
          <>
            <IconBolt size={11} />
            <span>{agentName}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        {isPending && (
          <>
            <span className="text-status-warning">Pendiente</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span className="tabular-nums">{formatTime(message.createdAt)}</span>
      </div>
    </li>
  )
}
