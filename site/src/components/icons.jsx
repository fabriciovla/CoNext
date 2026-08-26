// Íconos de línea, trazo único, sin dependencias externas.
//
// Son un juego propio y no un import desde `../../src/components/ui/icons`: la
// gracia de que el sitio sea un proyecto aparte es que un deploy roto de la
// dashboard no se lo lleve puesto, y un import cruzado ata los dos bundles.
// Acá viven solo los que usa la landing; el estilo (trazo 1.6, extremos
// redondeados, grilla de 24) es el mismo para que la marca no se parta en dos.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, size = 20, className = '', ...rest }) {
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

export const IconSparkles = (props) => (
  <Svg {...props}>
    <path d="M12 3.5l1.6 4.3 4.4 1.6-4.4 1.6L12 15.3l-1.6-4.3L6 9.4l4.4-1.6Z" />
    <path d="M18.5 15.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z" />
  </Svg>
)

export const IconBox = (props) => (
  <Svg {...props}>
    <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2Z" />
    <path d="M3.7 8.3 12 12.4l8.3-4.1" />
    <path d="M12 12.4V20" />
  </Svg>
)

export const IconClock = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7.4V12l3 1.8" />
  </Svg>
)

export const IconChart = (props) => (
  <Svg {...props}>
    <path d="M4 20V10.5" />
    <path d="M10 20V4.5" />
    <path d="M16 20v-6.5" />
    <path d="M20.5 20h-17" />
  </Svg>
)

export const IconBolt = (props) => (
  <Svg {...props}>
    <path d="M13.2 3.5 5.8 13.2h5.1l-.9 7.3 7.4-9.7h-5.1Z" />
  </Svg>
)

export const IconShield = (props) => (
  <Svg {...props}>
    <path d="M12 3.6l7 2.6v5.3c0 4-2.8 7.5-7 8.9-4.2-1.4-7-4.9-7-8.9V6.2Z" />
    <path d="M9 12.1l2.1 2.1 4-4.2" />
  </Svg>
)

export const IconCheck = (props) => (
  <Svg {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)

export const IconArrowRight = (props) => (
  <Svg {...props}>
    <path d="M4.5 12h15" />
    <path d="M13.5 6l6 6-6 6" />
  </Svg>
)

export const IconChevronDown = (props) => (
  <Svg {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </Svg>
)

export const IconChevronRight = (props) => (
  <Svg {...props}>
    <path d="M9.5 6l6 6-6 6" />
  </Svg>
)

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8 20 20" />
  </Svg>
)

export const IconSettings = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14.5a1.4 1.4 0 0 0 .3 1.6l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-1.6-.3 1.4 1.4 0 0 0-.9 1.3v.2a1.7 1.7 0 1 1-3.4 0v-.1a1.4 1.4 0 0 0-.9-1.3 1.4 1.4 0 0 0-1.6.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0 .3-1.6 1.4 1.4 0 0 0-1.3-.9h-.2a1.7 1.7 0 1 1 0-3.4h.1a1.4 1.4 0 0 0 1.3-.9 1.4 1.4 0 0 0-.3-1.6l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 1.6.3h.1a1.4 1.4 0 0 0 .9-1.3v-.2a1.7 1.7 0 1 1 3.4 0v.1a1.4 1.4 0 0 0 .9 1.3 1.4 1.4 0 0 0 1.6-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0-.3 1.6v.1a1.4 1.4 0 0 0 1.3.9h.2a1.7 1.7 0 1 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.9Z" />
  </Svg>
)

export const IconTag = (props) => (
  <Svg {...props}>
    <path d="M11.2 3.6H20v8.8l-8.4 8.4a1.4 1.4 0 0 1-2 0l-6.8-6.8a1.4 1.4 0 0 1 0-2Z" />
    <circle cx="16" cy="8" r="1.3" />
  </Svg>
)

export const IconHome = (props) => (
  <Svg {...props}>
    <path d="M3.5 10.2 12 3.8l8.5 6.4V19a1.2 1.2 0 0 1-1.2 1.2H4.7A1.2 1.2 0 0 1 3.5 19Z" />
    <path d="M9.5 20.2v-6h5v6" />
  </Svg>
)

export const IconUser = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8.2" r="3.4" />
    <path d="M4.8 20c1-3.6 3.9-5.6 7.2-5.6s6.2 2 7.2 5.6" />
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

export const IconPlus = (props) => (
  <Svg {...props}>
    <path d="M12 4.5v15M4.5 12h15" />
  </Svg>
)

export const IconPhone = (props) => (
  <Svg {...props}>
    <path d="M8.4 4.5 10 8.1l-1.9 1.7a11 11 0 0 0 6.1 6.1l1.7-1.9 3.6 1.6v3.2c0 .8-.7 1.4-1.5 1.3C10.8 19.4 4.6 13.2 4 6c-.1-.8.5-1.5 1.3-1.5h3.1Z" />
  </Svg>
)

export const IconCompose = (props) => (
  <Svg {...props}>
    <path d="M4.5 19.5h3l9.6-9.6a2.1 2.1 0 0 0-3-3L4.5 16.5Z" />
    <path d="M14.4 5.4 18.6 9.6" />
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

export const IconSend = (props) => (
  <Svg {...props}>
    <path d="M19.6 4.4 10.1 13.9" />
    <path d="M19.6 4.4 13.6 21.4l-3.5-7.5-7.5-3.5Z" />
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
    <path d="M17.5 13.6V6.5H10.4" />
  </Svg>
)

export const IconContactCard = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9.2" cy="11.2" r="2.1" />
    <path d="M13.2 10.2h4.4M13.2 13.8h3.2" />
  </Svg>
)

export const IconNote = (props) => (
  <Svg {...props}>
    <path d="M7 4.5h7.2L20 10.3V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1-1.5Z" />
    <path d="M14.2 4.6v4.7H20" />
  </Svg>
)

// Marca de GitHub: igual que WhatsApp, de relleno — el octocat de línea no se
// lee a 20px. viewBox 24 para que el tamaño coincida con el resto de la barra.
export const IconGitHub = ({ size = 20, className = '', ...rest }) => (
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

// Marca de WhatsApp: de relleno, la silueta de línea no se reconoce. Va con
// viewBox propio porque el trazado original no está en la grilla de 24.
export const IconWhatsApp = ({ size = 20, className = '', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    <path d="M16.1 3.2A12.7 12.7 0 0 0 5.2 22.4L3.4 29l6.8-1.8a12.7 12.7 0 1 0 5.9-24Zm0 23.2a10.5 10.5 0 0 1-5.4-1.5l-.4-.2-4 1 1.1-3.9-.3-.4a10.5 10.5 0 1 1 9 5Zm5.8-7.9c-.3-.2-1.9-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.6 8.6 0 0 1-2.5-1.6 9.5 9.5 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.7l.5-.6a2.3 2.3 0 0 0 .4-.6.6.6 0 0 0 0-.6c0-.2-.7-1.8-1-2.4s-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.2 6.2 0 0 0 1.3 3.3 14.2 14.2 0 0 0 5.5 4.8c2.4 1 2.4.7 2.9.6a3.2 3.2 0 0 0 2.1-1.5 2.6 2.6 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.4Z" />
  </svg>
)
