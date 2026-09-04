import {
  IconAlert,
  IconBox,
  IconBolt,
  IconChart,
  IconClock,
  IconInbox,
  IconInstagram,
  IconLayers,
  IconNote,
  IconShield,
  IconSparkles,
  IconTag,
  IconUsers,
  IconWhatsApp,
} from '../components/icons.jsx'

// Claves que usan las páginas de producto, comparativas, integraciones y docs.
// El mega menú, los índices y el artículo leen de acá: un ícono nuevo es una
// fila, no tres mapas que se desincronizan.
export const ICONOS_PAGINA = {
  inbox: IconInbox,
  tag: IconTag,
  note: IconNote,
  sparkles: IconSparkles,
  bolt: IconBolt,
  layers: IconLayers,
  box: IconBox,
  chart: IconChart,
  alert: IconAlert,
  whatsapp: IconWhatsApp,
  instagram: IconInstagram,
  users: IconUsers,
  shield: IconShield,
  clock: IconClock,
}
