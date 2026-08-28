import { useId } from 'react'
import WhatsappMark from './WhatsappMark'

// El distintivo del canal que va en la esquina del avatar.
//
// Hasta ahora la lista dibujaba el logo de WhatsApp fijo, porque era el único
// canal que existía. Con Instagram y Messenger adentro, un distintivo que
// miente es peor que ninguno: es lo único que dice por dónde contesta el
// equipo, y contestar por el canal equivocado no se puede deshacer.
//
// WhatsApp sigue viniendo de `logowsp.webp` (ver WhatsappMark: el archivo trae
// su propio contorno blanco). Los otros dos van como SVG en línea porque no
// tenemos el archivo, y se les dibuja el contorno a mano — sin él, el violeta
// de Instagram y el azul de Messenger se pegan al gris del avatar.
//
// Los colores de marca van literales, como el verde de WhatsApp: son de Meta,
// no de nuestra paleta, y no cambian entre temas.

function Marco({ size, className, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function InstagramMark({ size, className }) {
  // El id de los degradés sale de useId porque la lista dibuja un distintivo
  // por conversación: con un id fijo, todas comparten la primera definición y
  // se rompen si esa fila se desmonta.
  const id = useId().replace(/:/g, '')
  return (
    <Marco size={size} className={className}>
      <defs>
        <radialGradient id={`ig-${id}`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDD86B" />
          <stop offset="25%" stopColor="#FA7E1E" />
          <stop offset="50%" stopColor="#D62976" />
          <stop offset="75%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>
      {/* El contorno blanco, que es lo que lo despega del avatar. */}
      <rect x="0" y="0" width="24" height="24" rx="7.5" fill="#fff" />
      <rect x="1.6" y="1.6" width="20.8" height="20.8" rx="6.2" fill={`url(#ig-${id})`} />
      <rect
        x="6.1"
        y="6.1"
        width="11.8"
        height="11.8"
        rx="3.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16.5" cy="7.5" r="1.05" fill="#fff" />
    </Marco>
  )
}

function MessengerMark({ size, className }) {
  const id = useId().replace(/:/g, '')
  return (
    <Marco size={size} className={className}>
      <defs>
        <linearGradient id={`fb-${id}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="100%" stopColor="#006AFF" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="#fff" />
      <circle cx="12" cy="12" r="10.4" fill={`url(#fb-${id})`} />
      {/* El rayo: dos trazos que se cruzan, que es la forma que hace que el
          logo se reconozca aun a 15px. */}
      <path
        d="M12 5.4c-3.86 0-6.9 2.83-6.9 6.64 0 2.17.99 4.06 2.54 5.29v2.6l2.32-1.27c.62.17 1.27.26 1.95.26 3.86 0 6.9-2.83 6.9-6.64S15.86 5.4 12 5.4zm.69 8.94l-1.76-1.88-3.43 1.88 3.77-4 1.8 1.88 3.39-1.88-3.77 4z"
        fill="#fff"
      />
    </Marco>
  )
}

export default function ChannelMark({ channel = 'whatsapp', size = 15, className = '' }) {
  if (channel === 'instagram') return <InstagramMark size={size} className={className} />
  if (channel === 'messenger') return <MessengerMark size={size} className={className} />
  return <WhatsappMark size={size} className={className} />
}

// El nombre del canal para mostrar. La ficha del contacto lo usa donde iba el
// número: un IGSID en pantalla no le dice nada a nadie.
export const NOMBRE_CANAL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
}
