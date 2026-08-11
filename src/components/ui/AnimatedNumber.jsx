import useCountUp from '../../hooks/useCountUp'

// Anima solo el primer número del texto y deja el resto intacto: "85%" cuenta
// hasta 85 conservando el signo, y "1 h 20 m" no se rompe.
const NUMBER = /-?\d+(?:[.,]\d+)?/

export default function AnimatedNumber({ value, duration = 900, delay = 0, className }) {
  const text = String(value ?? '')
  const match = text.match(NUMBER)
  const raw = match?.[0] ?? ''
  const separator = raw.includes(',') ? ',' : '.'
  const decimals = /[.,]/.test(raw) ? raw.split(/[.,]/)[1].length : 0
  const animated = useCountUp(parseFloat(raw.replace(',', '.')), { duration, delay, decimals })

  if (!match) return <span className={className}>{text}</span>

  const shown = animated.toFixed(decimals).replace('.', separator)
  return (
    <span className={className}>
      {text.slice(0, match.index)}
      <span className="tabular-nums">{shown}</span>
      {text.slice(match.index + raw.length)}
    </span>
  )
}
