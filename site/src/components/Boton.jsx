// Botón de la landing. Casi siempre es un <a>: todo lo que se puede apretar
// lleva a algún lado (la app, WhatsApp, o una sección de esta misma página).
// `as="button"` es el caso del form de /login, que tiene que disparar submit.
//
// El primario es tinta sólida, no el degradé de marca: ese violeta→magenta
// era el único color con voz y le competía al titular. El secundario sigue
// siendo un borde que se aclara al pasar por encima.
const VARIANTES = {
  primario: `bg-ink-primary text-ink-inverted hover:bg-ink-primary/85`,
  secundario: `border border-tint/15 bg-tint/[0.04] text-ink-primary hover:border-tint/30 hover:bg-tint/[0.07]`,
}

const TAMANOS = {
  md: 'px-5 py-2.5 text-[14px]',
  lg: 'px-7 py-3.5 text-[15px]',
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
  const clases = `inline-flex items-center justify-center gap-2 rounded-full font-medium
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]
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
