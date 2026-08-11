const DOTS = {
  green: 'bg-status-good',
  amber: 'bg-status-warning',
  red: 'bg-status-critical',
  slate: 'bg-ink-muted',
}

export default function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-secondary ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} />
      {children}
    </span>
  )
}
