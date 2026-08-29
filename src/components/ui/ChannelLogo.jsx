// El logo grande del canal, el de verdad, para las tarjetas de conexión.
//
// No es lo mismo que `ChannelMark`, y por eso son dos archivos. `ChannelMark`
// es el distintivo de 15px que se apoya en la esquina de un avatar: ahí lo que
// importa es que se reconozca chiquito y que no se pegue al gris de abajo, así
// que Instagram y Messenger van como SVG dibujados a mano con su contorno.
// Acá el logo es el sujeto de la tarjeta, se ve a 34-40px y tiene que ser el
// logo de la marca y no una aproximación nuestra.
//
// Los archivos salen de los originales de `design/channel-logos/`: recortados a
// la tinta, con el fondo blanco sacado por relleno desde las cuatro esquinas
// (no por clave de color, que se comería el blanco de adentro del glifo) y a
// 128px en WebP sin pérdida — 15 KB y 5 KB contra los 88 KB de los JPG. Se sirven
// desde `public/`, que se copia entero al build.
//
// La URL lleva el `base` de Vite (`/` en local, `/app/` en el build). Un
// `src="/logoinstagram.webp"` ignora ese base y pide el archivo en la raíz del
// dominio, que es la landing: ahí está `logowsp.webp` (por eso WhatsApp
// cargaba) y no estos dos (por eso se veían rotos).
//
// WhatsApp reusa `logowsp.webp`, que es el mismo que usa el distintivo: trae su
// propio contorno blanco, pensado para apoyarse sobre un avatar. A este tamaño
// se lee como un halo fino y no molesta; un archivo aparte sin contorno sería
// una cuarta copia del mismo logo para mantener igual.
const BASE = import.meta.env.BASE_URL || '/'

const LOGOS = {
  whatsapp: `${BASE}logowsp.webp`,
  instagram: `${BASE}logoinstagram.webp`,
  messenger: `${BASE}logomessenger.webp`,
}

export default function ChannelLogo({ channel = 'whatsapp', size = 40, className = '' }) {
  return (
    <img
      src={LOGOS[channel]}
      alt=""
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
