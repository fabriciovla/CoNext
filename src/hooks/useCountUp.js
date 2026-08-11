import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Cuenta desde el valor que ya se está mostrando hasta el nuevo, así un dato que
// cambia en vivo (mensajes que entran) transiciona en vez de saltar.
export default function useCountUp(target, { duration = 900, delay = 0, decimals = 0 } = {}) {
  const to = Number.isFinite(target) ? target : 0
  const reduced = prefersReducedMotion()
  const [display, setDisplay] = useState(() => (reduced ? to : 0))
  const currentRef = useRef(reduced ? to : 0)

  useEffect(() => {
    if (reduced) {
      currentRef.current = to
      setDisplay(to)
      return undefined
    }

    const from = currentRef.current
    if (from === to) return undefined

    let frame = 0
    let start
    const step = (now) => {
      if (start === undefined) start = now
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4) // easeOutQuart: arranca rápido, frena largo
      const value = from + (to - from) * eased
      currentRef.current = value
      setDisplay(value)
      if (t < 1) frame = requestAnimationFrame(step)
      else currentRef.current = to
    }

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [to, duration, delay, reduced])

  const factor = 10 ** decimals
  return Math.round(display * factor) / factor
}
