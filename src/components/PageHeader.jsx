export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h1 className="animate-fade-down text-2xl font-semibold text-ink-primary">{title}</h1>
        {subtitle && (
          <p className="animate-fade-up mt-1 text-sm text-ink-muted" style={{ '--d': '90ms' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="animate-fade-up flex shrink-0 items-center gap-2" style={{ '--d': '140ms' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
