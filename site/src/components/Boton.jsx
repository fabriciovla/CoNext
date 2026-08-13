// Botón de la landing. Siempre es un <a>: todo lo que se puede apretar acá
// lleva a algún lado (la app, WhatsApp, o una sección de esta misma página).
// El día que haga falta uno que dispare algo en la página, se le agrega
// `as="button"` — hoy no existe y un componente que soporta los dos casos sin
// necesitarlos es código que nadie prueba.
//
// El primario usa el degradé de marca; el secundario es un borde que se aclara
// al pasar por encima. No hay un tercero a propósito: dos jerarquías alcanzan
// para que se entienda cuál es la acción principal.
const VARIANTES = {
  primario: `bg-accent-gradient text-white shadow-glow hover:brightness-110`,
  secundario: `border border-white/15 bg-white/[0.04] text-ink-primary hover:border-white/30 hover:bg-white/[0.07]`,
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
  ...props
}) {
  // Los enlaces internos (#funciones) no llevan target ni rel; los externos sí.
  // `noreferrer` va junto con `_blank` por seguridad: sin él, la pestaña que se
  // abre puede tocar la que la abrió.
  const externo = href?.startsWith('http')

  return (
    <a
      href={href}
      {...(externo ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet
        ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}
