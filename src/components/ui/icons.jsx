// Íconos de línea, trazo único, sin dependencias externas.
//
// Los de la navegación —Inicio, Bandeja, Agentes, Productos, Plantillas,
// Configuración, las carpetas de la bandeja, la lupa, el chevron y la salida—
// salen del pliego `ConexIconsDash/icons`, dibujados para esta app: 24x24,
// trazo 1.6, terminaciones redondeadas y, donde hay una caja, el mismo
// squircle del logotipo (radio al 39%). Por eso la bandeja, las plantillas y
// la nota son cuadrados redondeados y no rectángulos: es la forma de la marca
// repetida a 16px, y es lo que hace que la columna izquierda se lea como un
// juego y no como íconos juntados de a uno.
//
// Los que no están en el pliego (el clip, el micrófono, los acuses, las
// flechas) siguen siendo los de antes, con los mismos números: mismo tamaño,
// mismo trazo, mismas terminaciones.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, size = 16, className = '', ...rest }) {
  return (
    <svg
      {...base}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconInbox = (props) => (
  <Svg {...props}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="6.5" />
    <path d="M3.7 13.4h4.1l1.1 2c.3.5.8.8 1.4.8h3.4c.6 0 1.1-.3 1.4-.8l1.1-2h4.1" />
  </Svg>
)

export const IconBox = (props) => (
  <Svg {...props}>
    <path d="M10.4 3.9a3.2 3.2 0 0 1 3.2 0l5 2.8c1 .55 1.6 1.6 1.6 2.75v5.1c0 1.15-.6 2.2-1.6 2.75l-5 2.8a3.2 3.2 0 0 1-3.2 0l-5-2.8a3.15 3.15 0 0 1-1.6-2.75v-5.1c0-1.15.6-2.2 1.6-2.75l5-2.8Z" />
    <path d="M3.9 8.3 12 12.6l8.1-4.3" />
    <path d="M12 12.6V20.1" />
  </Svg>
)

// Carpeta del catálogo. La pestaña sale del borde de arriba y no es un
// rectángulo aparte: al tamaño al que se usa (15px, en la columna de carpetas)
// dos formas apiladas se leen como una mancha.
export const IconFolder = (props) => (
  <Svg {...props}>
    <path d="M3.6 9.2c0-2 0-3 .6-3.7.6-.7 1.5-.7 3.3-.7h.6c.8 0 1.2 0 1.5.2.4.2.6.5 1 1.1l.4.6c.2.3.3.5.5.6.2.1.5.1.9.1h2.7c1.9 0 2.8 0 3.4.7.6.7.6 1.7.6 3.7v2.9c0 2 0 3-.6 3.7-.6.7-1.5.7-3.4.7H7.5c-1.8 0-2.7 0-3.3-.7-.6-.7-.6-1.7-.6-3.7V9.2Z" />
  </Svg>
)

export const IconHome = (props) => (
  <Svg {...props}>
    <path d="M4 10.8c0-1.3.6-2.5 1.6-3.3l4.3-3.4a3.4 3.4 0 0 1 4.2 0l4.3 3.4c1 .8 1.6 2 1.6 3.3v4.6c0 2.7-1.6 4.1-4.4 4.1H8.4C5.6 19.5 4 18.1 4 15.4v-4.6Z" />
    <path d="M9.5 19.5v-3.2c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v3.2" />
  </Svg>
)

export const IconChart = (props) => (
  <Svg {...props}>
    <path d="M5.6 20.4v-5.6" />
    <path d="M12 20.4V7.4" />
    <path d="M18.4 20.4v-8.6" />
  </Svg>
)

export const IconSettings = (props) => (
  <Svg {...props}>
    <path d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />
    <path d="M18.2 12h2.2" />
    <path d="m16.38 7.62 1.56-1.56" />
    <path d="M12 5.8V3.6" />
    <path d="M7.62 7.62 6.06 6.06" />
    <path d="M5.8 12H3.6" />
    <path d="M7.62 16.38 6.06 17.94" />
    <path d="M12 18.2v2.2" />
    <path d="m16.38 16.38 1.56 1.56" />
  </Svg>
)

export const IconLogOut = (props) => (
  <Svg {...props}>
    <path d="M14.6 3.9h.4c2 0 3 0 3.6.7.6.7.6 1.7.6 3.7v7.4c0 2 0 3-.6 3.7-.6.7-1.6.7-3.6.7h-.4" />
    <path d="M13.4 12H4.4" />
    <path d="M7.6 8.6 4.2 12l3.4 3.4" />
  </Svg>
)

export const IconPlus = (props) => (
  <Svg {...props}>
    <path d="M12 4.5v15M4.5 12h15" />
  </Svg>
)

export const IconClose = (props) => (
  <Svg {...props}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Svg>
)

export const IconCheck = (props) => (
  <Svg {...props}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Svg>
)

export const IconClock = (props) => (
  <Svg {...props}>
    <path d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" />
    <path d="M12 8.2V12l2.8 1.8" />
  </Svg>
)

export const IconLock = (props) => (
  <Svg {...props}>
    <rect x="5.3" y="10.5" width="13.4" height="9" rx="1.6" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Svg>
)

export const IconUser = (props) => (
  <Svg {...props}>
    <path d="M12 11.4a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
    <path d="M5.6 20.4c0-3.2 2.9-5.2 6.4-5.2s6.4 2 6.4 5.2" />
  </Svg>
)

export const IconChevronRight = (props) => (
  <Svg {...props}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </Svg>
)

export const IconSearch = (props) => (
  <Svg {...props}>
    <path d="M10.8 17.2a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8Z" />
    <path d="m15.6 15.6 4.4 4.4" />
  </Svg>
)

export const IconBell = (props) => (
  <Svg {...props}>
    <path d="M12 3.6c-3.1 0-5.4 2.4-5.4 5.4 0 3.9-1.3 4.9-1.3 6 0 .8.7 1.4 1.9 1.4h9.6c1.2 0 1.9-.6 1.9-1.4 0-1.1-1.3-2.1-1.3-6 0-3-2.3-5.4-5.4-5.4Z" />
    <path d="M9.8 19.2a2.6 2.6 0 0 0 4.4 0" />
  </Svg>
)

export const IconFilter = (props) => (
  <Svg {...props}>
    <path d="M4 6h16M7.5 12h9M11 18h2" />
  </Svg>
)

// El avioncito es el único ícono que no va centrado por su caja: la punta
// estira el dibujo hacia arriba a la derecha y la cola deja vacío el rincón de
// abajo a la izquierda, así que con la caja centrada se ve corrido dentro del
// botón redondo. Va trazado 0.9 unidades a la izquierda y 0.9 abajo, comparado
// contra el centro real del botón. Corregir hasta el centro de masa del trazo
// (1.75) lo pasa de largo y queda tirado al otro lado. Si se retoca el dibujo,
// hay que mirar el corrimiento de nuevo.
export const IconSend = (props) => (
  <Svg {...props}>
    <path d="M19.6 4.4 10.1 13.9" />
    <path d="M19.6 4.4 13.6 21.4l-3.5-7.5-7.5-3.5Z" />
  </Svg>
)

export const IconBolt = (props) => (
  <Svg {...props}>
    <path d="M13 3 5.5 13.5H11l-.5 7.5L18 10.5h-5.5Z" />
  </Svg>
)

export const IconArchive = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
    <path d="M4.5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8.5" />
    <path d="M10 12.5h4" />
  </Svg>
)

export const IconChevronDown = (props) => (
  <Svg {...props}>
    <path d="m6 9.5 6 5.5 6-5.5" />
  </Svg>
)

export const IconPhone = (props) => (
  <Svg {...props}>
    <path d="M8.4 4.5 10 8.1l-1.9 1.7a11 11 0 0 0 6.1 6.1l1.7-1.9 3.6 1.6v3.2c0 .8-.7 1.4-1.5 1.3C10.8 19.4 4.6 13.2 4 6c-.1-.8.5-1.5 1.3-1.5h3.1Z" />
  </Svg>
)

export const IconPhoneIncoming = (props) => (
  <Svg {...props}>
    <path d="M8.4 8.5 9.6 11l-1.4 1.3a8.4 8.4 0 0 0 4.5 4.5l1.3-1.4 2.5 1.2v2.3c0 .6-.5 1-1.1 1-5.4-.5-9.7-4.8-10.2-10.2 0-.6.4-1.1 1-1.1h2.2Z" />
    <path d="M20 4.5 15 9.5" />
    <path d="M15 5.4v4.1h4.1" />
  </Svg>
)

export const IconUsers = (props) => (
  <Svg {...props}>
    <path d="M9.6 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
    <path d="M4 20.4c0-2.9 2.5-4.7 5.6-4.7s5.6 1.8 5.6 4.7" />
    <path d="M16 5.1a3.2 3.2 0 0 1 0 6.2" />
    <path d="M17.4 15.9c1.7.5 2.8 1.8 2.8 3.6" />
  </Svg>
)

export const IconContactCard = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9.3" cy="11" r="2.1" />
    <path d="M6.2 16.2c.5-1.4 1.7-2.2 3.1-2.2s2.6.8 3.1 2.2" />
    <path d="M15.2 10.2h3.1M15.2 13.6h3.1" />
  </Svg>
)

export const IconMegaphone = (props) => (
  <Svg {...props}>
    <path d="M4 10.4v3.2a1.6 1.6 0 0 0 1.6 1.6h2.2L15 19.5V4.5L7.8 8.8H5.6A1.6 1.6 0 0 0 4 10.4Z" />
    <path d="M18 9.2a4 4 0 0 1 0 5.6" />
    <path d="M8.2 15.4 9.4 20" />
  </Svg>
)

export const IconFlow = (props) => (
  <Svg {...props}>
    <circle cx="6.2" cy="6.2" r="2.3" />
    <circle cx="17.8" cy="12" r="2.3" />
    <circle cx="6.2" cy="17.8" r="2.3" />
    <path d="M8.3 7.3 15.7 11M15.7 13 8.3 16.7" />
  </Svg>
)

export const IconHelp = (props) => (
  <Svg {...props}>
    <path d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" />
    <path d="M9.8 9.6a2.3 2.3 0 0 1 4.5.5c0 1.9-2.3 1.7-2.3 3.5" />
    <path d="M12 16.8h.01" strokeWidth="2" />
  </Svg>
)

export const IconSmile = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M8.8 14.2a4 4 0 0 0 6.4 0" />
    <path d="M9.3 9.6h.01M14.7 9.6h.01" strokeWidth="2" />
  </Svg>
)

export const IconPaperclip = (props) => (
  <Svg {...props}>
    <path d="M19 11.5 12.4 18a4 4 0 0 1-5.7-5.7l7-7a2.7 2.7 0 0 1 3.8 3.8l-7 7a1.3 1.3 0 0 1-1.9-1.9l6.3-6.3" />
  </Svg>
)

export const IconMic = (props) => (
  <Svg {...props}>
    <rect x="9.4" y="3.5" width="5.2" height="10.4" rx="2.6" />
    <path d="M5.8 11.6a6.2 6.2 0 0 0 12.4 0" />
    <path d="M12 17.8v2.7" />
  </Svg>
)

export const IconTemplate = (props) => (
  <Svg {...props}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="6.5" />
    <path d="M3.8 9.4h16.4" />
    <path d="M9.4 20.3V9.7" />
  </Svg>
)

export const IconSparkles = (props) => (
  <Svg {...props}>
    <path d="M10.6 3.6c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5Z" />
    <path d="M17.7 15.1c.25 1.6.85 2.2 2.45 2.45-1.6.25-2.2.85-2.45 2.45-.25-1.6-.85-2.2-2.45-2.45 1.6-.25 2.2-.85 2.45-2.45Z" />
  </Svg>
)

export const IconCompose = (props) => (
  <Svg {...props}>
    <path d="M4.5 19.5h3l9.6-9.6a2.1 2.1 0 0 0-3-3L4.5 16.5Z" />
    <path d="M14.4 5.4 18.6 9.6" />
  </Svg>
)

export const IconNote = (props) => (
  <Svg {...props}>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="6.5" />
    <path d="M8.4 8.6h7.2" />
    <path d="M8.4 12h7.2" />
    <path d="M8.4 15.4h4" />
  </Svg>
)

export const IconDoubleCheck = (props) => (
  <Svg {...props}>
    <path d="M2.5 12.6 6.6 16.7 14.4 8.4" />
    <path d="M10.4 15.4 12 17l7.8-8.6" />
  </Svg>
)

export const IconDots = (props) => (
  <Svg {...props}>
    <path d="M5.5 12h.01M12 12h.01M18.5 12h.01" strokeWidth="2.4" />
  </Svg>
)

export const IconCheckCircle = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M8.4 12.2 11 14.8l4.6-5.2" />
  </Svg>
)

export const IconBlock = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M6.2 6.2 17.8 17.8" />
  </Svg>
)

export const IconArrowIn = (props) => (
  <Svg {...props}>
    <path d="M17.5 6.5 6.5 17.5" />
    <path d="M6.5 10.4v7.1h7.1" />
  </Svg>
)

export const IconArrowOut = (props) => (
  <Svg {...props}>
    <path d="M6.5 17.5 17.5 6.5" />
    <path d="M10.4 6.5h7.1v7.1" />
  </Svg>
)

// Flechas de variación de las tarjetas de KPI: van al lado del porcentaje, así
// que la dirección se lee incluso sin distinguir el verde del rojo.
// Flecha recta y no la línea quebrada de un gráfico: al tamaño al que se usa
// (al lado de un porcentaje) el zigzag se lee como un garabato, y lo único que
// tiene que decir es si sube o baja.
export const IconTrendUp = (props) => (
  <Svg {...props}>
    <path d="M6 18 18 6" />
    <path d="M10.5 6H18v7.5" />
  </Svg>
)

export const IconTrendDown = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12" />
    <path d="M10.5 18H18v-7.5" />
  </Svg>
)

export const IconSun = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6" />
  </Svg>
)

export const IconMoon = (props) => (
  <Svg {...props}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
  </Svg>
)

export const IconSidebarToggle = (props) => (
  <Svg {...props}>
    <rect x="3.6" y="4.8" width="16.8" height="14.4" rx="2" />
    <path d="M9.6 4.8v14.4" />
  </Svg>
)

// La flecha del mouse con su estela: es el ícono de "esto se toca", y por eso
// solo aparece en los pasos del recorrido que esperan una acción.
export const IconPointer = (props) => (
  <Svg {...props}>
    <path d="M6.4 4.2 17.8 11.1 12.6 12.4 10.7 17.4Z" />
    <path d="M13.6 13.6 18 18" />
  </Svg>
)

export const IconTrash = (props) => (
  <Svg {...props}>
    <path d="M4.5 6.8h15" />
    <path d="M9.4 6.8V5.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.6" />
    <path d="M6.6 6.8 7.5 19a1.2 1.2 0 0 0 1.2 1.1h6.6a1.2 1.2 0 0 0 1.2-1.1l.9-12.2" />
  </Svg>
)

export const IconCopy = (props) => (
  <Svg {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 6.2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.2" />
  </Svg>
)

export const IconPencil = (props) => (
  <Svg {...props}>
    <path d="M4.5 19.5h3.2L18.4 8.8a1.8 1.8 0 0 0 0-2.5l-.7-.7a1.8 1.8 0 0 0-2.5 0L4.5 16.3Z" />
    <path d="M14.2 7.1l2.7 2.7" />
  </Svg>
)

export const IconDownload = (props) => (
  <Svg {...props}>
    <path d="M12 4v10.5" />
    <path d="M8 11l4 3.7 4-3.7" />
    <path d="M4.8 17.4v1.4a1.2 1.2 0 0 0 1.2 1.2h12a1.2 1.2 0 0 0 1.2-1.2v-1.4" />
  </Svg>
)

export const IconFile = (props) => (
  <Svg {...props}>
    <path d="M13.6 3.8H7.4a1.6 1.6 0 0 0-1.6 1.6v13.2a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V8.4Z" />
    <path d="M13.6 3.8v4.6h4.6" />
  </Svg>
)

// Los dos eslabones de una cadena. Es lo que marca una fuente de conocimiento
// que salió de una página web, contra el archivo y el texto escrito a mano.
export const IconLink = (props) => (
  <Svg {...props}>
    <path d="M10.3 13.7a3.6 3.6 0 0 0 5.4.4l2.2-2.2a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.2" />
    <path d="M13.7 10.3a3.6 3.6 0 0 0-5.4-.4l-2.2 2.2a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2" />
  </Svg>
)

// Cuadrado y no dos barras: es el botón de frenar la grabación, y el símbolo de
// pausa haría pensar que se puede seguir grabando después.
export const IconStop = (props) => (
  <Svg {...props}>
    <rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconAlert = (props) => (
  <Svg {...props}>
    <path d="M12 4.2 21 19.4H3Z" />
    <path d="M12 10v3.6" />
    <path d="M12 16.6h.01" strokeWidth="2.2" />
  </Svg>
)

// Marcas de los proveedores de login. Google lleva el color de la marca
// (sin él no se lee); GitHub es silueta, `currentColor`.
export const IconGoogle = ({ size = 16, className = '', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    {/* Los cuatro hex son la marca de Google: las guidelines de Sign in with
        Google prohíben la G en un solo color. Es la misma excepción que el
        verde de WhatsApp — acá el color *es* el dibujo. */}
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
)

export const IconGitHub = ({ size = 16, className = '', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 10.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0Z" />
  </svg>
)
