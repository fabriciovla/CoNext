// Íconos de línea, trazo único, sin dependencias externas.
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
    <path d="M3.5 12.5h4.2l1.3 2.4h5.9l1.3-2.4h4.3" />
    <path d="M5.4 6.5h13.2l2 6v6.2a1.3 1.3 0 0 1-1.3 1.3H4.7a1.3 1.3 0 0 1-1.3-1.3V12.5Z" />
  </Svg>
)

export const IconBox = (props) => (
  <Svg {...props}>
    <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2Z" />
    <path d="M3.7 8.3 12 12.4l8.3-4.1" />
    <path d="M12 12.4V20" />
  </Svg>
)

// Carpeta del catálogo. La pestaña sale del borde de arriba y no es un
// rectángulo aparte: al tamaño al que se usa (15px, en la columna de carpetas)
// dos formas apiladas se leen como una mancha.
export const IconFolder = (props) => (
  <Svg {...props}>
    <path d="M3.8 8V6.6a1.4 1.4 0 0 1 1.4-1.4h3.3l2 2.4h8.1a1.4 1.4 0 0 1 1.4 1.4v8.4a1.4 1.4 0 0 1-1.4 1.4H5.2a1.4 1.4 0 0 1-1.4-1.4Z" />
  </Svg>
)

export const IconHome = (props) => (
  <Svg {...props}>
    <path d="M3.5 10.2 12 3.8l8.5 6.4V19a1.2 1.2 0 0 1-1.2 1.2H4.7A1.2 1.2 0 0 1 3.5 19Z" />
    <path d="M9.5 20.2v-6h5v6" />
  </Svg>
)

export const IconChart = (props) => (
  <Svg {...props}>
    <path d="M4 20V10.5" />
    <path d="M11 20V4" />
    <path d="M18 20v-7" />
    <path d="M3.5 20h17" />
  </Svg>
)

export const IconSettings = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
  </Svg>
)

export const IconLogOut = (props) => (
  <Svg {...props}>
    <path d="M9.5 20H5.8A1.8 1.8 0 0 1 4 18.2V5.8A1.8 1.8 0 0 1 5.8 4h3.7" />
    <path d="M16.5 16.5 21 12l-4.5-4.5" />
    <path d="M21 12H9.5" />
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
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7.5V12l3 2" />
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
    <circle cx="12" cy="8.2" r="3.4" />
    <path d="M4.8 20c1-3.6 3.9-5.6 7.2-5.6s6.2 2 7.2 5.6" />
  </Svg>
)

export const IconChevronRight = (props) => (
  <Svg {...props}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </Svg>
)

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.8-4.8" />
  </Svg>
)

export const IconBell = (props) => (
  <Svg {...props}>
    <path d="M6 10.5a6 6 0 0 1 12 0c0 3.5 1 5 1.5 5.8H4.5C5 15.5 6 14 6 10.5Z" />
    <path d="M10.3 19a1.9 1.9 0 0 0 3.4 0" />
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
    <path d="M5.5 9 12 15.5 18.5 9" />
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
    <circle cx="9.6" cy="8.6" r="3.1" />
    <path d="M3.8 19.2c.9-3 3.2-4.7 5.8-4.7s4.9 1.7 5.8 4.7" />
    <path d="M16.2 5.9a3.1 3.1 0 0 1 0 5.6" />
    <path d="M17.4 14.9c1.6.6 2.8 2.1 3.3 4.3" />
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
    <circle cx="12" cy="12" r="8.3" />
    <path d="M9.8 9.6a2.3 2.3 0 1 1 2.9 2.4c-.5.2-.7.6-.7 1.1v.5" />
    <path d="M12 16.6h.01" strokeWidth="2" />
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
    <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2" />
    <path d="M3.6 9.4h16.8M9.4 9.4v10" />
  </Svg>
)

export const IconSparkles = (props) => (
  <Svg {...props}>
    <path d="M11 4.2 12.4 8l3.8 1.4-3.8 1.4L11 14.6 9.6 10.8 5.8 9.4 9.6 8Z" />
    <path d="M17.6 14.4 18.3 16.3l1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z" />
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
    <rect x="3.8" y="4.8" width="16.4" height="14.4" rx="2" />
    <path d="M7.6 9.4h8.8M7.6 12.8h8.8M7.6 16.2h5" />
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

export const IconTrash = (props) => (
  <Svg {...props}>
    <path d="M4.5 6.8h15" />
    <path d="M9.4 6.8V5.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.6" />
    <path d="M6.6 6.8 7.5 19a1.2 1.2 0 0 0 1.2 1.1h6.6a1.2 1.2 0 0 0 1.2-1.1l.9-12.2" />
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
