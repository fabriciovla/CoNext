// La tarjeta se apoya en el borde y no en la sombra. Por defecto es una
// superficie quieta: no se mueve ni se ilumina al pasar el mouse, porque la
// mayoría no son clickeables y reaccionar sin llevar a ningún lado es ruido.
// `interactive` es para las que sí lo son (las que abren algo).
export default function Card({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = 'p-5',
  interactive = false,
}) {
  const hasHeader = Boolean(title || actions)

  return (
    <div
      className={`rounded-xl border border-tint/[0.08] bg-surface-card shadow-card
        ${interactive ? 'card-interactive cursor-pointer hover:border-tint/[0.16] hover:shadow-card-hover' : ''}
        ${className}`}
    >
      {/* Sin línea divisoria bajo el título: la separación la da el aire del
          cuerpo, que ya trae su propio padding. Una raya por tarjeta, con seis
          tarjetas en pantalla, son seis rayas que no dicen nada. */}
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-[13.5px] font-semibold tracking-[-0.005em] text-ink-primary">
                {title}
              </h2>
            )}
            {/* La bajada es la línea que casi todas las tarjetas venían metiendo
                a mano como primer párrafo del cuerpo, cada una con su tamaño.
                Acá adentro queda atada al título y no la empuja el contenido. */}
            {description && (
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
