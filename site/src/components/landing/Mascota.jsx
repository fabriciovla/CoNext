// El fantasma de la marca en grande, suelto sobre la hoja.
//
// Es el mismo dibujo que las caras de agente de la dashboard
// (`src/components/ui/AgentAvatar.jsx`): el cuerpo del logotipo, los dos ojos, y
// un objeto que dice de qué se encarga. Lo que cambia es el encuadre — allá el
// fantasma va en color y a 24px adentro de una fila, acá va en crema, a más de
// cien píxeles y sin nada atrás, así que lo que lo despega de la hoja es la
// sombra y no un fondo de color.
//
// **Son las mismas coordenadas a propósito**: los objetos están dibujados para
// un cuerpo escalado 0.84 alrededor de (248, 246), y los auriculares del
// recepcionista van fuera de ese grupo porque tienen que calzar con el borde del
// cuerpo ya escalado. Si se retoca una cara allá, se retoca acá.
//
// Va en línea y no como archivo por lo mismo que el logotipo: son cuatro
// dibujos de un kB que ya viajan adentro del HTML.

// El fantasma del logotipo, con la proporción del pliego.
const CUERPO =
  'M 82 258 C 82 142, 152 62, 256 62 C 360 62, 430 142, 430 258 L 430 372 C 430 428, 386 452, 356 420 C 336 398, 306 398, 288 424 C 268 452, 240 452, 220 424 C 202 398, 172 398, 152 420 C 122 450, 82 428, 82 372 Z'

const TINTA = '#14140f'

// El crema del pliego, un punto más cálido que el de la baldosa del ícono: el
// cuerpo cae sobre la hoja blanca del sitio y el #FFFCF6 de los avatares —que
// allá se recorta contra un fondo de color— acá desaparecería.
const CREMA = '#F4EEE0'

// `currentColor` es el crema del cuerpo: lo usan los objetos para lo que tienen
// calado adentro de la tinta (el agujero de la etiqueta, el centro del engranaje,
// el filamento de la lámpara).
const OBJETOS = {
  sola: null,
  recepcionista: (
    <>
      <path d="M 98 252 A 152 168 0 0 1 398 252" fill="none" stroke={TINTA} strokeWidth="30" strokeLinecap="round" />
      <ellipse cx="98" cy="268" rx="25" ry="35" fill={TINTA} />
      <ellipse cx="398" cy="268" rx="25" ry="35" fill={TINTA} />
      <path d="M394 300q-6 62-66 58" fill="none" stroke={TINTA} strokeWidth="18" strokeLinecap="round" />
      <circle cx="326" cy="358" r="17" fill={TINTA} />
    </>
  ),
  ventas: (
    <g transform="rotate(-20 372 372)">
      <rect x="302" y="302" width="140" height="140" rx="36" fill={TINTA} />
      <circle cx="338" cy="338" r="17" fill="currentColor" />
    </g>
  ),
  soporte: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((giro) => (
        <rect
          key={giro}
          x="358"
          y="296"
          width="28"
          height="40"
          rx="10"
          fill={TINTA}
          transform={`rotate(${giro} 372 376)`}
        />
      ))}
      <circle cx="372" cy="376" r="56" fill={TINTA} />
      <circle cx="372" cy="376" r="21" fill="currentColor" />
    </>
  ),
  // La única que no sale del catálogo de agentes: es el fantasma que acompaña a
  // la sugerencia de IA en la muestra del producto, y ahí lo que hay que decir
  // no es un rol sino que a alguien se le ocurrió la respuesta.
  idea: (
    <>
      <path d="M446 300l24-16M452 352h28M442 404l24 14" stroke={TINTA} strokeWidth="16" strokeLinecap="round" />
      <circle cx="372" cy="352" r="56" fill={TINTA} />
      <path d="M356 348v-12a16 16 0 0 1 32 0v12" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <rect x="344" y="396" width="56" height="20" rx="10" fill={TINTA} />
      <rect x="352" y="424" width="40" height="18" rx="9" fill={TINTA} />
    </>
  ),
}

export default function Mascota({ cara = 'sola', size = 112, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      // El crema va en `color` y no repetido en cada `fill`: de acá salen el
      // cuerpo y lo que los objetos tienen calado sobre la tinta.
      style={{ color: CREMA }}
      className={`shrink-0 select-none drop-shadow-[0_14px_22px_rgba(18,23,34,0.13)] ${className}`}
    >
      <g transform="translate(248 246) scale(0.84) translate(-256 -256)">
        <path d={CUERPO} fill="currentColor" />
        <rect x="184" y="198" width="46" height="94" rx="23" transform="rotate(-7 207 245)" fill={TINTA} />
        <rect x="291" y="189" width="44" height="88" rx="22" transform="rotate(10 313 233)" fill={TINTA} />
      </g>
      {OBJETOS[cara]}
    </svg>
  )
}
