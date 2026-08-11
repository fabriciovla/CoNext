const VARIANTS = {
  primary:
    'bg-white text-black hover:bg-white/85 focus-visible:ring-white/40',
  secondary:
    'bg-white/5 text-ink-secondary border border-white/10 hover:bg-white/10 hover:text-ink-primary focus-visible:ring-white/20',
  danger:
    'bg-status-critical/10 text-status-critical border border-status-critical/25 hover:bg-status-critical/15 focus-visible:ring-status-critical/40',
  ghost:
    'text-ink-muted hover:bg-white/5 hover:text-ink-primary focus-visible:ring-white/20',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:-translate-y-px active:translate-y-0 active:scale-[0.97]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page
        disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:translate-y-0
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
