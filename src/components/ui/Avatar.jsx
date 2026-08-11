export default function Avatar({ name, size = 36, className = '' }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}
