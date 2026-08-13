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

// El único de relleno y no de línea: es la marca de WhatsApp, y su silueta solo
// se reconoce maciza. Va con viewBox propio porque el trazado original no está
// dibujado en la grilla de 24 de los demás.
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
