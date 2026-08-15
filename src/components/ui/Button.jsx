// Sin salto ni rebote al pasar el mouse: un botón que se mueve solo llama la
// atención cada vez que el puntero lo cruza de camino a otra cosa. Lo que
// cambia es el color, que ya alcanza para decir "esto se puede tocar".
const VARIANTS = {
  primary: 'bg-ink-primary text-ink-inverted hover:bg-ink-primary/85 focus-visible:ring-tint/40',
  secondary:
    'border border-tint/[0.12] text-ink-secondary hover:border-tint/25 hover:text-ink-primary focus-visible:ring-tint/20',
  // El rojo se guarda para el botón que confirma de verdad, dentro del modal.
  // El que solo *abre* la pregunta va en `ghost`: ver Agentes y Productos.
  danger:
    'bg-status-critical text-status-ink hover:bg-status-critical/85 focus-visible:ring-status-critical/40',
  ghost: 'text-ink-muted hover:bg-tint/[0.06] hover:text-ink-primary focus-visible:ring-tint/20',
}

const SIZES = {
  sm: 'h-7 px-2.5 text-[12px]',
  md: 'h-9 px-3.5 text-[13px]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page
        disabled:cursor-not-allowed disabled:opacity-40
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
