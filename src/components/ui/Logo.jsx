// El logotipo de la marca. Es el mismo componente que usa la landing
// (`site/src/components/Logo.jsx`): si cambia uno, cambian los dos.
//
// Va inline y no como <img> por dos razones: así hereda el color del contexto
// (`fill="currentColor"`, que es lo que lo hace servir en los dos temas sin dos
// archivos) y así no cuesta una request aparte.
//
// El texto sigue siendo un <text> y no trazados, así que depende de que
// 'Baloo 2' esté disponible; lo está porque la servimos nosotros (@font-face en
// index.css, con `font-display: block`).
//
// El 186 del viewBox no es al ojo: "chrm." en Baloo 2 ExtraBold mide 2570
// unidades sobre 1000 por em, o sea 185.04 al font-size 72 de acá abajo. Queda
// justo a propósito, sin aire muerto que después empuje al resto de la barra. Si
// alguna vez cambia el texto o el peso, hay que recalcularlo: uno de menos
// recorta el punto final.
export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 186 100" className={className} role="img" aria-label="chrm." fill="currentColor">
      <text x="0" y="76" fontFamily="'Baloo 2', Verdana, Geneva, sans-serif" fontWeight="800" fontSize="72">
        chrm.
      </text>
    </svg>
  )
}
