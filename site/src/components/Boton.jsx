// Botón de la landing. Casi siempre es un <a>: todo lo que se puede apretar
// lleva a algún lado (la app, WhatsApp, o una sección de esta misma página).
// `as="button"` es el caso del form de /login, que tiene que disparar submit.
//
// El sólido es el azul de marca (`--violet`, #4058ff), no la tinta. Un CTA
// oscuro al lado del "Empezar gratis" de la barra se leía como la misma
// acción con otro peso; el azul es el que marca la principal. El secundario
// es la píldora blanca con un trazo fino: el par de dock.us (Request Demo /
// Start for Free). `acento` es el mismo relleno: queda para que en la barra
// se lea en el código cuál de los tres escalones es el fuerte.
//
// La forma es una cápsula, no un rectángulo redondeado: `rounded-full` y una
// altura fija, con el aire a los costados (px) más largo que el vertical, que
// es lo que hace que los extremos sean semicírculos de verdad. `py` variable
// se comía esa proporción en cuanto el texto o un ícono empujaban.
//
// `text-ink-inverted` y no `text-white`: acá es blanco igual, porque el sitio
// es claro y nada más, pero el que escribe un color literal es el que después
// lo copia a la dashboard, donde el acento es más claro y el blanco encima no
// contrasta. El hover baja a `violet-strong` y no a `/90`: el alfa aclara el
// azul contra la hoja y parece que el botón se apaga.
const SOLIDO = `bg-violet text-ink-inverted hover:bg-violet-strong`

const VARIANTES = {
  primario: SOLIDO,
  secundario: `border border-tint/12 bg-surface-card text-ink-primary hover:border-tint/25 hover:bg-surface-hover`,
  acento: SOLIDO,
  // El CTA quieto: relleno periwinkle, tinta oscura. Es el "Go to Dock.us"
  // de una 404 — una acción, pero no la de vender. El sólido de marca acá
  // pesaría igual que "Empezar gratis".
  suave: `bg-violet-soft text-ink-primary hover:bg-violet/15`,
}

const TAMANOS = {
  sm: 'h-9 px-5 text-[14px]',
  md: 'h-11 px-6 text-[14px]',
  lg: 'h-12 px-8 text-[15px]',
}

export default function Boton({
  href,
  variante = 'primario',
  tamano = 'md',
  className = '',
  children,
  as,
  ...props
}) {
  const clases = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium
        transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet
        ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`

  if (as === 'button') {
    return (
      <button type="submit" className={clases} {...props}>
        {children}
      </button>
    )
  }

  // Los enlaces internos (#funciones, /login) no llevan target ni rel; los
  // externos sí. `noreferrer` va junto con `_blank` por seguridad: sin él, la
  // pestaña que se abre puede tocar la que la abrió.
  const externo = href?.startsWith('http')

  return (
    <a
      href={href}
      {...(externo ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={clases}
      {...props}
    >
      {children}
    </a>
  )
}
