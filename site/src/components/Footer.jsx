import Logo from './Logo'
import { IconWhatsApp } from './icons'
import { EMAIL, WHATSAPP_URL } from '../config'

// Los enlaces a secciones apuntan a `/#seccion` y no a `#seccion` a secas: el
// pie está en todas las páginas, y desde /privacidad un ancla suelta no lleva a
// ninguna parte porque esa sección no existe en esa página. Con la barra
// adelante, el navegador vuelve al inicio y baja hasta ahí. Estando ya en el
// inicio no recarga nada: solo cambia el fragmento.
const SECCIONES = [
  { href: '/#funciones', label: 'Funciones' },
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/#preguntas', label: 'Preguntas' },
]

const LEGALES = [
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos' },
  { to: '/eliminar-datos', label: 'Eliminar datos' },
]

const claseEnlace =
  'text-[14px] text-ink-muted transition-colors duration-200 hover:text-ink-primary'

function Columna({ titulo, children }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">{titulo}</p>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo className="h-8 w-auto text-ink-primary" />
            <p className="mt-4 text-[14px] leading-relaxed text-ink-muted">
              El CRM que atiende el WhatsApp de tu negocio con agentes de IA, sobre la API oficial de
              WhatsApp Business.
            </p>
          </div>

          <Columna titulo="Producto">
            {SECCIONES.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className={claseEnlace}>
                  {label}
                </a>
              </li>
            ))}
          </Columna>

          <Columna titulo="Legales">
            {LEGALES.map(({ to, label }) => (
              <li key={to}>
                <a href={to} className={claseEnlace}>
                  {label}
                </a>
              </li>
            ))}
          </Columna>

          <Columna titulo="Contacto">
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={`${claseEnlace} inline-flex items-center gap-2`}>
                <IconWhatsApp size={14} />
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className={claseEnlace}>
                {EMAIL}
              </a>
            </li>
          </Columna>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          {/* El año sale del reloj y no escrito a mano: un pie que dice 2026 en
              2027 es la señal más barata de que el sitio está abandonado. */}
          <p className="text-[13px] text-ink-muted">© {new Date().getFullYear()} chrm.</p>
          {/* Atribución de marca, que Meta pide para usar el nombre. Dice solo
              de quién es la marca y no niega ninguna relación: el camino al
              mercado es el programa de Tech Providers, o sea que sí hay una, y
              un desmentido acá habría que salir a corregirlo después. */}
          <p className="text-[13px] text-ink-muted">
            WhatsApp es una marca registrada de Meta Platforms, Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
