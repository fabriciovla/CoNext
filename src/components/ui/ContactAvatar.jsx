import { useId } from 'react'

// El marcador de un contacto sin foto: doce fantasmas de la marca, uno de fondo
// de color y una cara distinta cada uno. Salen del pliego
// `ConextLogoContactos/avatars/`.
//
// Antes era un solo dibujo —`IconoSinFoto.webp`, el mismo gris para todo el
// mundo— y lo que distinguía una fila de otra era el nombre al lado. Doce
// fantasmas en vez de uno no cambia eso: la fila se sigue leyendo por el
// nombre, y por eso `ghostFor` no es al azar sino un hash del contacto —el
// mismo número de teléfono cae siempre en el mismo fantasma, entre pestañas,
// entre recargas y entre las distintas listas donde aparece (la bandeja, la
// ficha, "Para revisar" de Inicio).
//
// **Van en línea, como el logotipo y las caras de agente** (`AgentAvatar`): la
// dashboard se publica bajo `/app/`, así que un `src="/avatars/ghost-a.svg"`
// pediría el archivo a la landing (ver `ChannelLogo`), y son doce pedidos más
// para dibujos de un kB. Los PNG del pliego no se usan.
//
// El cuerpo del fantasma es **el mismo dibujo en los doce** — el mismo path que
// usa `AgentAvatar`, acá en color crema y no en el color de fondo, porque el
// contraste tiene que sostenerse contra doce fondos distintos y no contra uno
// solo. Cada entrada aporta su color de fondo, su cara (ojos, boca) y, en dos
// casos, una leve rotación del fantasma: sin esas dos torcidas los doce se
// leen como el mismo dibujo con la cara cambiada, y con ellas se leen como
// doce personajes.
//
// **El recorte es un `clipPath` con id propio (`useId`)**, no `overflow-hidden`
// en un contenedor: una lista de contactos dibuja este componente decenas de
// veces en la misma pantalla, y un id fijo haría que todas las instancias
// compartan el primer clip que se montó — si esa desmonta, el resto pierde el
// recorte. Es el mismo motivo por el que la máscara del logotipo usa `useId()`.

const CUERPO = 'M 82 258 C 82 142, 152 62, 256 62 C 360 62, 430 142, 430 258 L 430 372 C 430 428, 386 452, 356 420 C 336 398, 306 398, 288 424 C 268 452, 240 452, 220 424 C 202 398, 172 398, 152 420 C 122 450, 82 428, 82 372 Z'

const CREMA = '#FFFCF6'
const TINTA = '#14140f'

// Alfabético, como el pliego: no hay un orden "mejor" y así se corresponde
// directo con los nombres de archivo si hay que ir a buscar uno.
const FANTASMAS = [
  {
    letra: 'a',
    fondo: '#7BA7D9',
    cara: (
      <>
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'b',
    fondo: '#E0A050',
    cara: (
      <>
        <path d="M179 248q28-44 56 0" fill="none" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
        <path d="M287 240q28-44 56 0" fill="none" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
      </>
    ),
  },
  {
    letra: 'c',
    fondo: '#8FA98C',
    cara: (
      <>
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <path d="M287 240q28-44 56 0" fill="none" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
      </>
    ),
  },
  {
    letra: 'd',
    fondo: '#E08A96',
    cara: (
      <>
        <circle cx="207" cy="242" r="31" fill={TINTA} />
        <circle cx="313" cy="234" r="29" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'e',
    fondo: '#A98FC0',
    cara: (
      <>
        <path d="M180 250h54" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
        <path d="M288 242h52" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
      </>
    ),
  },
  {
    letra: 'f',
    fondo: '#6FA98F',
    cara: (
      <>
        <ellipse cx="207" cy="242" rx="21" ry="27" fill={TINTA} />
        <ellipse cx="313" cy="234" rx="20" ry="26" fill={TINTA} />
        <circle cx="258" cy="336" r="19" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'g',
    fondo: '#D98A7B',
    cara: (
      <>
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
        <path d="M216 330q40 40 80 0" fill="none" stroke={TINTA} strokeWidth="21" strokeLinecap="round" />
      </>
    ),
  },
  {
    letra: 'h',
    fondo: '#E8C060',
    cara: (
      <>
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
        <path d="M214 322h84a42 42 0 0 1-84 0Z" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'i',
    fondo: '#7FA0B8',
    cara: (
      <>
        <g transform="translate(20 0)">
          <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
          <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
        </g>
      </>
    ),
  },
  {
    letra: 'j',
    fondo: '#96B870',
    cara: (
      <>
        <rect x="192" y="212" width="31" height="62" rx="15" transform="rotate(-7 207 243)" fill={TINTA} />
        <rect x="298" y="204" width="30" height="58" rx="15" transform="rotate(10 313 233)" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'k',
    fondo: '#C08A70',
    rotar: 7,
    cara: (
      <>
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
      </>
    ),
  },
  {
    letra: 'l',
    fondo: '#B08FA0',
    rotar: -6,
    cara: (
      <>
        <path d="M179 248q28-44 56 0" fill="none" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
        <path d="M287 240q28-44 56 0" fill="none" stroke={TINTA} strokeWidth="23" strokeLinecap="round" />
        <path d="M226 322q30 26 60 0" fill="none" stroke={TINTA} strokeWidth="20" strokeLinecap="round" />
      </>
    ),
  },
]

// Mismo hash que `ConextLogoContactos/avatars/avatar.js`: una suma pesada por
// posición y módulo. No busca distribuir parejo -alcanza con que sea estable-,
// así que no hace falta nada más elaborado para doce casilleros.
function ghostFor(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000
  return h % FANTASMAS.length
}

// `seed` es lo que identifica al contacto — el teléfono crudo cuando hay uno,
// que es la identidad real de una conversación en todo el CRM (ver
// `utils/phone.js`), o el nombre cuando no. Vacío cae siempre en el primero:
// no hay contacto sin nombre y sin teléfono a la vez, así que no es un caso
// que haya que resolver mejor.
export default function ContactAvatar({ seed = '', size = 36, className = '' }) {
  const fantasma = FANTASMAS[ghostFor(String(seed))]
  const clipId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="256" cy="256" r="256" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="256" cy="256" r="256" fill={fantasma.fondo} />
        <g
          transform={`translate(256 258) rotate(${fantasma.rotar ?? 0}) scale(0.82) translate(-256 -256)`}
        >
          <path d={CUERPO} fill={CREMA} />
          {fantasma.cara}
        </g>
      </g>
    </svg>
  )
}
