import { useEffect, useState } from 'react'

// Arranca en 0 y crece al valor real después del primer pintado: sin ese salto
// inicial el navegador no tiene dos anchos que interpolar y no habría animación.
export default function ProgressBar({ value, delay = 0, className = 'bg-white', trackClassName = '' }) {
  const target = Math.max(0, Math.min(100, value))
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(target), delay + 60)
    return () => clearTimeout(timer)
  }, [target, delay])

  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${trackClassName}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
