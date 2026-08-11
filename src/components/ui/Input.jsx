export default function Input({ label, id, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink-primary
          placeholder:text-ink-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10
          ${className}`}
        {...props}
      />
    </label>
  )
}
