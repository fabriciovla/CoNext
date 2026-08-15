// La tarjeta se apoya en el borde y no en la sombra. Por defecto es una
// superficie quieta: no se mueve ni se ilumina al pasar el mouse, porque la
// mayoría no son clickeables y reaccionar sin llevar a ningún lado es ruido.
// `interactive` es para las que sí lo son (las que abren algo).
export default function Card({
  title,
  actions,
  children,
  className = '',
  bodyClassName = 'p-5',
  interactive = false,
}) {
  return (
    <div
      className={`rounded-xl border border-tint/[0.08] bg-surface-card shadow-card
        ${interactive ? 'card-interactive cursor-pointer hover:border-tint/[0.16] hover:shadow-card-hover' : ''}
        ${className}`}
    >
      {/* Sin línea divisoria bajo el título: la separación la da el aire del
          cuerpo, que ya trae su propio padding. Una raya por tarjeta, con seis
          tarjetas en pantalla, son seis rayas que no dicen nada. */}
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          {title && <h2 className="text-[13px] font-semibold text-ink-primary">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
