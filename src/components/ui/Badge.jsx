const DOTS = {
  green: 'bg-status-good',
  amber: 'bg-status-warning',
  red: 'bg-status-critical',
  slate: 'bg-ink-faint',
}

// Sin recuadro ni fondo: el punto de color ya distingue el estado, y una fila de
// píldoras enmarcadas en una tabla pesa más que los datos que acompaña.
export default function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] text-ink-secondary ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} />
      {children}
    </span>
  )
}
