import { useLayoutEffect, useRef } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Cuenta desde el valor que ya se está mostrando hasta el nuevo, así un dato que
// cambia en vivo (mensajes que entran) transiciona en vez de saltar.
//
// Devuelve un ref para colgar de un nodo: el número se escribe directo en el
// DOM. Antes esto vivía en un `useState` y cada cuadro re-renderizaba el árbol
// del componente — con cuatro tarjetas contando a la vez, eso son 240 renders
// por segundo compitiendo con las animaciones de entrada de la página.
export default function useCountUp(target, { duration = 900, delay = 0, format = String } = {}) {
  const to = Number.isFinite(target) ? target : 0
  const reduced = prefersReducedMotion()
  const ref = useRef(null)
  // Lo que se está mostrando ahora, para que un cambio en vivo arranque desde
  // ahí y no desde cero.
  const shownRef = useRef(0)
  // `format` se recrea en cada render del que llama; si fuera dependencia del
  // efecto, cualquier re-render (el poll cada 6s) reiniciaría la cuenta.
  const formatRef = useRef(format)
  formatRef.current = format

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const write = (value) => {
      node.textContent = formatRef.current(value)
    }

    if (reduced) {
      shownRef.current = to
      write(to)
      return undefined
    }

    const from = shownRef.current
    if (from === to) {
      write(to)
      return undefined
    }

    // Se pinta el valor de arranque en el mismo cuadro en que se monta el nodo
    // (por eso `useLayoutEffect`): con un efecto normal se vería un parpadeo.
    write(from)

    let frame = 0
    let start
    const step = (now) => {
      if (start === undefined) start = now
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4) // easeOutQuart: arranca rápido, frena largo
      const value = from + (to - from) * eased
      shownRef.current = value
      write(value)
      if (t < 1) {
        frame = requestAnimationFrame(step)
      } else {
        shownRef.current = to
        write(to)
      }
    }

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [to, duration, delay, reduced])

  return ref
}
