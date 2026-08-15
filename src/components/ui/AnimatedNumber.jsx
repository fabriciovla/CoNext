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
  const ref = useCountUp(parseFloat(raw.replace(',', '.')), {
    duration,
    delay,
    format: (v) => v.toFixed(decimals).replace('.', separator),
  })

  if (!match) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {text.slice(0, match.index)}
      {/* Va vacío a propósito: el número lo escribe el hook en el DOM. Si lo
          renderizara React, cada cuadro de la cuenta sería un render más. */}
      <span ref={ref} className="tabular-nums" />
      {text.slice(match.index + raw.length)}
    </span>
  )
}
