export default function Card({ title, actions, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <div
      className={`card-interactive rounded-2xl border border-white/[0.06] bg-surface-card shadow-card
        hover:border-white/[0.12] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_18px_40px_-20px_rgba(0,0,0,0.9)]
        ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          {title && <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
