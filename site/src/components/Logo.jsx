// El logotipo, tomado de public/conext-monochrome.svg.
//
// Va inline y no como <img> por dos razones: así hereda el color del contexto
// (el archivo original viene con fill #111111, que sobre el fondo negro del
// sitio es invisible) y así no cuesta una request aparte.
//
// El texto sigue siendo un <text> y no trazados, así que depende de que
// 'Baloo 2' esté disponible; ahora lo está siempre porque la servimos nosotros
// (@font-face en index.css, precargada en index.html).
//
// El 241 del viewBox no es al ojo: "conext" en Baloo 2 ExtraBold mide 240.84 px
// al font-size 72 de acá abajo. Queda
// justo a propósito, sin aire muerto que después empuje al resto del navbar. Si
// alguna vez cambia el texto o el peso, hay que recalcularlo: uno de menos
// recorta la última letra.
//
// El contrapeso de ese ajuste es que el fallback a Verdana ya no entra en el
// viewBox y saldría cortado. Por eso el @font-face usa `font-display: block`:
// antes que mostrar un logo mal, no muestra ninguno mientras baja la fuente.
export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 241 100" className={className} role="img" aria-label="conext" fill="currentColor">
      <text x="0" y="76" fontFamily="'Baloo 2', Verdana, Geneva, sans-serif" fontWeight="800" fontSize="72">
        conext
      </text>
    </svg>
  )
}
