// La cara de un agente: el fantasma de la marca con un objeto que dice de qué
// se encarga. Son veinte y salen del pliego `ConextEmojis/agent-emoji/`.
//
// Antes acá iba un emoji del sistema, y eso tenía dos problemas. Uno es que no
// era nuestro: lo dibuja la fuente del sistema operativo de quien mira —Segoe
// UI Emoji en Windows, Apple Color Emoji en Mac—, así que el mismo agente tenía
// una cara distinta en cada máquina del equipo y ninguna se parecía al resto de
// la app. El otro es que elegir entre mil quinientos emojis para contestar
// "¿quién es este agente?" es una pregunta abierta donde alcanzaba con veinte
// respuestas: acá el catálogo son los roles que un negocio tiene de verdad.
//
// **Van en línea y no como archivo**, por lo mismo que el logotipo: la
// dashboard se publica bajo `/app/`, así que un `src="/ventas.svg"` pediría el
// archivo a la landing (ver `ChannelLogo`), y son veinte pedidos más para
// dibujos de 800 bytes. Los PNG del pliego no se usan.
//
// El cuerpo y los ojos son **el mismo dibujo en los veinte**, así que se dibujan
// una vez acá y cada entrada aporta solo su color y su objeto.
//
// **El color del fantasma es `currentColor`**, no un atributo repetido: varios
// objetos lo reusan para lo que está calado adentro de la tinta —el renglón de
// la agenda, las ruedas del camión, el símbolo del billete—, y así el color de
// una cara se escribe en un solo lugar. La tinta (`#14140f`) sí va literal, como
// el verde de WhatsApp: es la del pliego, no la del tema, y el dibujo tiene que
// leerse igual en claro y en oscuro porque siempre cae sobre el pastel del
// cuerpo.

// El fantasma del logotipo, con la misma proporción del pliego.
const CUERPO = 'M 82 258 C 82 142, 152 62, 256 62 C 360 62, 430 142, 430 258 L 430 372 C 430 428, 386 452, 356 420 C 336 398, 306 398, 288 424 C 268 452, 240 452, 220 424 C 202 398, 172 398, 152 420 C 122 450, 82 428, 82 372 Z'

const TINTA = '#14140f'

// El orden es el del selector, y no es alfabético: arriba los roles que le
// sirven a cualquier negocio y abajo los que dependen del rubro.
export const AVATARES = [
  {
    // El único cuyo objeto no se apoya sobre el cuerpo sino que lo abraza: los
    // auriculares van en coordenadas de la caja de 512 —fuera del grupo del
    // fantasma— porque tienen que calzar con el borde del cuerpo ya escalado.
    key: 'recepcionista',
    color: '#7BA7D9',
    objeto: (
      <>
        <path d="M 98 252 A 152 168 0 0 1 398 252" fill="none" stroke={TINTA} strokeWidth="30" strokeLinecap="round" />
        <ellipse cx="98" cy="268" rx="25" ry="35" fill={TINTA} />
        <ellipse cx="398" cy="268" rx="25" ry="35" fill={TINTA} />
        <path d="M394 300q-6 62-66 58" fill="none" stroke={TINTA} strokeWidth="18" strokeLinecap="round" />
        <circle cx="326" cy="358" r="17" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'ventas',
    color: '#E0A050',
    objeto: (
      <>
        <g transform="rotate(-20 372 372)">
          <rect x="302" y="302" width="140" height="140" rx="36" fill={TINTA} />
          <circle cx="338" cy="338" r="17" fill="currentColor" />
        </g>
      </>
    ),
  },
  {
    key: 'carrito',
    color: '#B08FA0',
    objeto: (
      <>
        <path d="M288 308h22l32 100h84l26-68h-120" fill="none" stroke={TINTA} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="352" cy="442" r="19" fill={TINTA} />
        <circle cx="420" cy="442" r="19" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'leads',
    color: '#D98A7B',
    objeto: (
      <>
        <path d="M290 308h164a12 12 0 0 1 9 20l-53 60v70a10 10 0 0 1-15 9l-32-19a10 10 0 0 1-5-9v-51l-53-60a12 12 0 0 1 9-20Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'marketing',
    color: '#E0906B',
    objeto: (
      <>
        <g transform="rotate(-14 372 374)">
          <path d="M298 342h30v68h-30a17 17 0 0 1-17-17v-34a17 17 0 0 1 17-17Z" fill={TINTA} />
          <path d="M338 334l104-42v168l-104-42z" fill={TINTA} />
          <path d="M304 414h28l10 44a13 13 0 0 1-13 15h-14a13 13 0 0 1-13-12z" fill={TINTA} />
        </g>
      </>
    ),
  },
  {
    key: 'soporte',
    color: '#8FA98C',
    objeto: (
      <>
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(0 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(45 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(90 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(135 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(180 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(225 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(270 372 376)" />
        <rect x="358" y="296" width="28" height="40" rx="10" fill={TINTA} transform="rotate(315 372 376)" />
        <circle cx="372" cy="376" r="56" fill={TINTA} />
        <circle cx="372" cy="376" r="21" fill="currentColor" />
      </>
    ),
  },
  {
    key: 'postventa',
    color: '#E08A96',
    objeto: (
      <>
        <path d="M370 452c-58-34-80-66-80-100a44 44 0 0 1 80-22 44 44 0 0 1 80 22c0 34-22 66-80 100Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'reclamos',
    color: '#9A8FD9',
    objeto: (
      <>
        <path d="M372 294l74 26v62c0 44-32 64-74 78-42-14-74-34-74-78v-62Z" fill={TINTA} />
        <path d="M340 374l26 26 42-46" fill="none" stroke="currentColor" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: 'escalamiento',
    color: '#D97B6B',
    objeto: (
      <>
        <path d="M372 292a14 14 0 0 1 10 4l52 52a12 12 0 0 1-9 21h-27v66a26 26 0 0 1-52 0v-66h-27a12 12 0 0 1-9-21l52-52a14 14 0 0 1 10-4Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'agenda',
    color: '#A98FC0',
    objeto: (
      <>
        <rect x="296" y="308" width="152" height="140" rx="36" fill={TINTA} />
        <path d="M300 356h144" stroke="currentColor" strokeWidth="18" />
        <rect x="322" y="286" width="22" height="44" rx="11" fill={TINTA} />
        <rect x="400" y="286" width="22" height="44" rx="11" fill={TINTA} />
        <circle cx="350" cy="400" r="13" fill="currentColor" />
        <circle cx="394" cy="400" r="13" fill="currentColor" />
      </>
    ),
  },
  {
    key: 'envios',
    color: '#7FA0B8',
    objeto: (
      <>
        <rect x="284" y="330" width="96" height="74" rx="20" fill={TINTA} />
        <path d="M388 352h32l30 36v16h-62z" fill={TINTA} />
        <circle cx="318" cy="422" r="24" fill={TINTA} />
        <circle cx="420" cy="422" r="24" fill={TINTA} />
        <circle cx="318" cy="422" r="9" fill="currentColor" />
        <circle cx="420" cy="422" r="9" fill="currentColor" />
      </>
    ),
  },
  {
    key: 'stock',
    color: '#C99060',
    objeto: (
      <>
        <path d="M360 292 438 336 438 420 360 464 282 420 282 336 Z" fill={TINTA} />
        <path d="M282 336 360 380 438 336" fill="none" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
        <path d="M360 380v84" stroke="currentColor" strokeWidth="20" />
      </>
    ),
  },
  {
    key: 'cobranzas',
    color: '#6FA98F',
    objeto: (
      <>
        <circle cx="372" cy="374" r="74" fill={TINTA} />
        <path d="M396 344h-32a18 18 0 0 0 0 36h16a18 18 0 0 1 0 36h-32M372 328v16M372 400v16" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'facturacion',
    color: '#B8A87F',
    objeto: (
      <>
        <path d="M312 292h120a16 16 0 0 1 16 16v148l-25-20-25 20-26-20-25 20-25-20-26 20V308a16 16 0 0 1 16-16Z" fill={TINTA} />
        <path d="M336 336h72M336 372h72" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'reportes',
    color: '#78A8A0',
    objeto: (
      <>
        <rect x="292" y="380" width="36" height="74" rx="17" fill={TINTA} />
        <rect x="352" y="326" width="36" height="128" rx="17" fill={TINTA} />
        <rect x="412" y="356" width="36" height="98" rx="17" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'onboarding',
    color: '#96B870',
    objeto: (
      <>
        <path d="M304 292v168" stroke={TINTA} strokeWidth="28" strokeLinecap="round" />
        <path d="M326 304h112a10 10 0 0 1 8 16l-20 26 20 26a10 10 0 0 1-8 16H326Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'conocimiento',
    color: '#C08A70',
    objeto: (
      <>
        <path d="M296 318c26-14 54-14 72 4v116c-18-18-46-18-72-4Z" fill={TINTA} />
        <path d="M448 318c-26-14-54-14-72 4v116c18-18 46-18 72-4Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'traductor',
    color: '#6FA0A8',
    objeto: (
      <>
        <circle cx="372" cy="374" r="74" fill={TINTA} />
        <path d="M298 374h148M372 300c28 32 28 116 0 148M372 300c-28 32-28 116 0 148" fill="none" stroke="currentColor" strokeWidth="14" />
      </>
    ),
  },
  {
    key: 'encuestas',
    color: '#E8C060',
    objeto: (
      <>
        <path d="M372 290l25 53 58 8-42 41 10 58-51-28-51 28 10-58-42-41 58-8Z" fill={TINTA} />
      </>
    ),
  },
  {
    key: 'nocturno',
    color: '#5C6B96',
    objeto: (
      <>
        <path d="M404 302a78 78 0 1 0 42 110 62 62 0 0 1-42-110Z" fill={TINTA} />
      </>
    ),
  },
]

// El de los agentes que se crean sin elegir cara, y el que siembra el alta de un
// cliente. Recepcionista porque es el rol que existe en todos los negocios.
export const AVATAR_POR_DEFECTO = 'recepcionista'

// `avatar` es la clave de una de las veinte caras. Un agente de antes de esto
// tiene guardado un emoji de texto: se dibuja como venía haciéndose, con la
// fuente del sistema. Perder la cara que alguien eligió es peor que una lista
// despareja, y la primera vez que abra ese agente el selector le ofrece las
// nuestras.
export default function AgentAvatar({ avatar, size = 24, className = '' }) {
  const cara = AVATARES.find((a) => a.key === (avatar || AVATAR_POR_DEFECTO))

  if (!cara) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: size * 0.82, width: size, height: size }}
      >
        {avatar}
      </span>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={className}
      // De acá sale el `currentColor` de adentro: el cuerpo y lo que los objetos
      // tienen calado sobre la tinta.
      style={{ color: cara.color }}
    >
      <g transform="translate(248 246) scale(0.84) translate(-256 -256)">
        <path d={CUERPO} fill="currentColor" />
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
      </g>
      {cara.objeto}
    </svg>
  )
}
